"use client";

import {
  Boxes,
  Check,
  CircleDollarSign,
  LoaderCircle,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Scissors,
  X,
} from "lucide-react";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BatchStatus,
  changeBatchStatus,
  createOperation,
  createWorkBatch,
  CreateWorkBatchInput,
  getOperationChecklist,
  listBatches,
  listOwners,
  managerError,
  OperationChecklistItem,
  OwnerItem,
  OwnerPricingType,
  WorkBatchItem,
} from "@/lib/manager-api";

const inputClass =
  "h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold outline-none transition placeholder:text-slate-300 focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]";

const textareaClass =
  "w-full resize-none rounded-2xl border border-[var(--line)] bg-white p-4 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]";

const statusLabels: Record<
  BatchStatus,
  string
> = {
  ACTIVE:
    "فعال",
  COMPLETED:
    "تکمیل‌شده",
  CANCELLED:
    "لغوشده",
  ARCHIVED:
    "بایگانی‌شده",
};

type SelectedOperation = {
  selected: boolean;
  target: string;
};

type SelectedOperations =
  Record<
    string,
    SelectedOperation
  >;

function faNumber(
  value:
    number | string,
): string {
  try {
    return new Intl.NumberFormat(
      "fa-IR",
    ).format(
      BigInt(
        value.toString(),
      ),
    );
  } catch {
    return String(
      value,
    );
  }
}

function money(
  value:
    string | number,
): string {
  return `${faNumber(
    value,
  )} تومان`;
}

function faDate(
  value:
    string | null,
): string {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(
      "fa-IR",
      {
        year:
          "numeric",
        month:
          "short",
        day:
          "numeric",
      },
    ).format(
      new Date(
        value,
      ),
    );
  } catch {
    return value;
  }
}

function localToday(): string {
  const now =
    new Date();

  const adjusted =
    new Date(
      now.getTime() -
        now.getTimezoneOffset() *
          60_000,
    );

  return adjusted
    .toISOString()
    .slice(
      0,
      10,
    );
}

export function BatchesSection() {
  const [
    items,
    setItems,
  ] =
    useState<
      WorkBatchItem[]
    >([]);

  const [
    owners,
    setOwners,
  ] =
    useState<
      OwnerItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    q,
    setQ,
  ] =
    useState("");

  const [
    ownerFilter,
    setOwnerFilter,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      BatchStatus | ""
    >("");

  const [
    createOpen,
    setCreateOpen,
  ] =
    useState(
      false,
    );

  const load =
    useCallback(
      async (
        silent =
          false,
      ) => {
        if (
          silent
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        setError(
          null,
        );

        try {
          const [
            batchResponse,
            ownerResponse,
          ] =
            await Promise.all([
              listBatches({
                q:
                  q.trim() ||
                  undefined,

                ownerId:
                  ownerFilter ||
                  undefined,

                status:
                  statusFilter ||
                  undefined,

                page:
                  1,

                pageSize:
                  100,
              }),

              listOwners(),
            ]);

          setItems(
            batchResponse.items,
          );

          setOwners(
            ownerResponse.items,
          );
        } catch (
          caught
        ) {
          setError(
            managerError(
              caught,
            ),
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        ownerFilter,
        q,
        statusFilter,
      ],
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void load();
          },
          250,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [
      load,
    ],
  );

  async function updateStatus(
    batch:
      WorkBatchItem,
    next:
      BatchStatus,
  ) {
    if (
      next ===
      batch.status
    ) {
      return;
    }

    setError(
      null,
    );

    try {
      await changeBatchStatus(
        batch.id,
        next,
      );

      await load(
        true,
      );
    } catch (
      caught
    ) {
      setError(
        managerError(
          caught,
        ),
      );
    }
  }

  const activeCount =
    items.filter(
      (
        batch,
      ) =>
        batch.status ===
        "ACTIVE",
    ).length;

  const completedCount =
    items.filter(
      (
        batch,
      ) =>
        batch.status ===
        "COMPLETED",
    ).length;

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black">
            سری‌کارها
          </h2>

          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
            سری تولید را به صاحبکار، مدل، قیمت قرارداد و عملیات‌های لازم متصل کنید.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={
              () => {
                void load(
                  true,
                );
              }
            }
            className="flex size-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--muted)]"
          >
            <RefreshCw
              className={`size-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={
              () =>
                setCreateOpen(
                  true,
                )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-xs font-black text-white"
          >
            <PackagePlus className="size-4" />
            سری‌کار جدید
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[20px] border border-red-100 bg-red-50 p-4 text-xs font-bold leading-6 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2">
        <StatBox
          label="نمایش داده‌شده"
          value={
            items.length
          }
        />

        <StatBox
          label="فعال"
          value={
            activeCount
          }
          active
        />

        <StatBox
          label="تکمیل‌شده"
          value={
            completedCount
          }
        />
      </div>

      <div className="mb-4 grid gap-2 rounded-[22px] border border-[var(--line)] bg-white p-3 lg:grid-cols-[1fr_190px_190px]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />

          <input
            value={
              q
            }
            onChange={(
              event,
            ) =>
              setQ(
                event.target
                  .value,
              )
            }
            className={`${inputClass} pr-11`}
            placeholder="کد سری یا مدل..."
          />
        </div>

        <select
          value={
            ownerFilter
          }
          onChange={(
            event,
          ) =>
            setOwnerFilter(
              event.target
                .value,
            )
          }
          className={
            inputClass
          }
        >
          <option value="">
            همه صاحبکارها
          </option>

          {owners.map(
            (
              owner,
            ) => (
              <option
                key={
                  owner.id
                }
                value={
                  owner.id
                }
              >
                {owner.name}
              </option>
            ),
          )}
        </select>

        <select
          value={
            statusFilter
          }
          onChange={(
            event,
          ) =>
            setStatusFilter(
              event.target
                .value as
                | BatchStatus
                | "",
            )
          }
          className={
            inputClass
          }
        >
          <option value="">
            همه وضعیت‌ها
          </option>

          <option value="ACTIVE">
            فعال
          </option>

          <option value="COMPLETED">
            تکمیل‌شده
          </option>

          <option value="CANCELLED">
            لغوشده
          </option>

          <option value="ARCHIVED">
            بایگانی
          </option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-[26px] border border-[var(--line)] bg-white p-14 text-center">
          <LoaderCircle className="mx-auto size-6 animate-spin text-[var(--brand)]" />
        </div>
      ) : items.length ===
        0 ? (
        <div className="rounded-[26px] border border-dashed border-[var(--line-strong)] bg-white p-12 text-center">
          <Boxes className="mx-auto size-8 text-slate-300" />

          <p className="mt-4 text-sm font-black">
            سری‌کاری پیدا نشد
          </p>

          <p className="mt-2 text-xs text-[var(--muted)]">
            اولین سری تولید را ثبت کنید یا فیلترها را تغییر دهید.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(
            (
              batch,
            ) => (
              <article
                key={
                  batch.id
                }
                className="rounded-[24px] border border-[var(--line)] bg-white p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black">
                        {batch.code}
                      </p>

                      <StatusBadge
                        status={
                          batch.status
                        }
                      />
                    </div>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {batch.modelName}
                      {" · "}
                      {batch.owner
                        ?.name ??
                        "صاحبکار نامشخص"}
                    </p>
                  </div>

                  <select
                    value={
                      batch.status
                    }
                    onChange={(
                      event,
                    ) => {
                      void updateStatus(
                        batch,
                        event.target
                          .value as
                          BatchStatus,
                      );
                    }}
                    className="h-10 rounded-xl border border-[var(--line)] bg-white px-3 text-[11px] font-black outline-none"
                  >
                    <option value="ACTIVE">
                      فعال
                    </option>

                    <option value="COMPLETED">
                      تکمیل‌شده
                    </option>

                    <option value="CANCELLED">
                      لغوشده
                    </option>

                    <option value="ARCHIVED">
                      بایگانی
                    </option>
                  </select>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-soft)] p-3 sm:grid-cols-4">
                  <Info
                    label="تعداد کل"
                    value={`${faNumber(
                      batch.totalQuantity,
                    )} عدد`}
                  />

                  <Info
                    label="شروع"
                    value={
                      faDate(
                        batch.startDate,
                      )
                    }
                  />

                  <Info
                    label="قرارداد"
                    value={
                      batch.ownerPricingType ===
                      "PER_PIECE"
                        ? "دانه‌ای"
                        : "مبلغ ثابت"
                    }
                  />

                  <Info
                    label="مبلغ"
                    value={
                      batch.ownerPricingType ===
                      "PER_PIECE"
                        ? `${money(
                            batch.ownerUnitPrice ??
                              "0",
                          )} / عدد`
                        : money(
                            batch.ownerFixedAmount ??
                              "0",
                          )
                    }
                  />
                </div>

                {batch.note && (
                  <div className="mt-3 rounded-2xl border border-[var(--line)] p-3">
                    <p className="text-[9px] font-black text-[var(--muted)]">
                      توضیح سری
                    </p>

                    <p className="mt-1 text-xs leading-6">
                      {batch.note}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-black text-[var(--muted)]">
                    وضعیت عملیات
                  </p>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {batch.operations.map(
                      (
                        operation,
                      ) => {
                        const approvedPercent =
                          operation.targetQuantity >
                          0
                            ? Math.min(
                                100,
                                Math.round(
                                  (
                                    operation.approvedQuantity /
                                    operation.targetQuantity
                                  ) *
                                    100,
                                ),
                              )
                            : 0;

                        return (
                          <div
                            key={
                              operation.batchOperationId
                            }
                            className="rounded-2xl border border-[var(--line)] p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-black">
                                {operation.name}
                              </p>

                              <span className="text-[9px] font-black text-[var(--brand)]">
                                {faNumber(
                                  approvedPercent,
                                )}
                                ٪
                              </span>
                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[var(--brand)]"
                                style={{
                                  width:
                                    `${approvedPercent}%`,
                                }}
                              />
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                              <MiniInfo
                                label="هدف"
                                value={
                                  operation.targetQuantity
                                }
                              />

                              <MiniInfo
                                label="ثبت"
                                value={
                                  operation.claimedQuantity
                                }
                              />

                              <MiniInfo
                                label="تأیید"
                                value={
                                  operation.approvedQuantity
                                }
                              />
                            </div>

                            <p className="mt-2 text-[9px] text-[var(--muted)]">
                              ظرفیت باقی‌مانده:{" "}
                              <b className="text-[var(--text)]">
                                {faNumber(
                                  operation.remainingQuantity,
                                )}
                              </b>
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      <CreateBatchModal
        open={
          createOpen
        }
        onClose={
          () =>
            setCreateOpen(
              false,
            )
        }
        onCreated={
          async () => {
            setCreateOpen(
              false,
            );

            await load(
              true,
            );
          }
        }
      />
    </section>
  );
}

function CreateBatchModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;

  onClose:
    () => void;

  onCreated:
    () => Promise<void>;
}) {
  const [
    owners,
    setOwners,
  ] =
    useState<
      OwnerItem[]
    >([]);

  const [
    operations,
    setOperations,
  ] =
    useState<
      OperationChecklistItem[]
    >([]);

  const [
    selected,
    setSelected,
  ] =
    useState<SelectedOperations>(
      {},
    );

  const [
    optionsLoading,
    setOptionsLoading,
  ] =
    useState(
      false,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    addingOperation,
    setAddingOperation,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    code,
    setCode,
  ] =
    useState("");

  const [
    ownerId,
    setOwnerId,
  ] =
    useState("");

  const [
    modelName,
    setModelName,
  ] =
    useState("");

  const [
    totalQuantity,
    setTotalQuantity,
  ] =
    useState("");

  const [
    pricingType,
    setPricingType,
  ] =
    useState<OwnerPricingType>(
      "PER_PIECE",
    );

  const [
    price,
    setPrice,
  ] =
    useState("");

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      localToday(),
    );

  const [
    note,
    setNote,
  ] =
    useState("");

  const [
    newOperationName,
    setNewOperationName,
  ] =
    useState("");

  const [
    newOperationRate,
    setNewOperationRate,
  ] =
    useState("");

  const loadOptions =
    useCallback(
      async () => {
        setOptionsLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const [
            ownerResponse,
            operationResponse,
          ] =
            await Promise.all([
              listOwners({
                isActive:
                  true,
              }),

              getOperationChecklist(),
            ]);

          setOwners(
            ownerResponse.items,
          );

          setOperations(
            operationResponse.items,
          );

          setSelected(
            (
              current,
            ) => {
              const next = {
                ...current,
              };

              for (
                const operation of
                operationResponse.items
              ) {
                if (
                  !next[
                    operation.id
                  ]
                ) {
                  next[
                    operation.id
                  ] = {
                    selected:
                      false,
                    target:
                      "",
                  };
                }
              }

              return next;
            },
          );
        } catch (
          caught
        ) {
          setError(
            managerError(
              caught,
            ),
          );
        } finally {
          setOptionsLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(
    () => {
      if (
        open
      ) {
        void loadOptions();
      }
    },
    [
      loadOptions,
      open,
    ],
  );

  const selectedCount =
    useMemo(
      () =>
        Object.values(
          selected,
        ).filter(
          (
            item,
          ) =>
            item.selected,
        ).length,
      [
        selected,
      ],
    );

  async function addInlineOperation() {
    if (
      !newOperationName.trim()
    ) {
      setError(
        "نام عملیات جدید را وارد کنید.",
      );

      return;
    }

    if (
      !/^[1-9]\d*$/.test(
        newOperationRate,
      )
    ) {
      setError(
        "نرخ عملیات جدید را به‌صورت عدد صحیح وارد کنید.",
      );

      return;
    }

    setAddingOperation(
      true,
    );

    setError(
      null,
    );

    try {
      const created =
        await createOperation({
          name:
            newOperationName.trim(),

          initialRate:
            newOperationRate,
        });

      const newChecklistItem:
        OperationChecklistItem = {
          ...created,
          selected:
            false,
        };

      setOperations(
        (
          current,
        ) => [
          ...current,
          newChecklistItem,
        ],
      );

      setSelected(
        (
          current,
        ) => ({
          ...current,

          [created.id]: {
            selected:
              true,

            target:
              "",
          },
        }),
      );

      setNewOperationName(
        "",
      );

      setNewOperationRate(
        "",
      );
    } catch (
      caught
    ) {
      setError(
        managerError(
          caught,
        ),
      );
    } finally {
      setAddingOperation(
        false,
      );
    }
  }

  async function submit(
    event:
      FormEvent,
  ) {
    event.preventDefault();

    const quantity =
      Number(
        totalQuantity,
      );

    if (
      !code.trim() ||
      !ownerId ||
      !modelName.trim() ||
      !Number.isInteger(
        quantity,
      ) ||
      quantity <=
        0
    ) {
      setError(
        "کد سری، صاحبکار، مدل و تعداد کل را کامل کنید.",
      );

      return;
    }

    if (
      !/^[1-9]\d*$/.test(
        price,
      )
    ) {
      setError(
        "مبلغ قرارداد را به‌صورت عدد صحیح وارد کنید.",
      );

      return;
    }

    const operationPayload =
      operations
        .filter(
          (
            operation,
          ) =>
            selected[
              operation.id
            ]?.selected,
        )
        .map(
          (
            operation,
          ) => {
            const target =
              selected[
                operation.id
              ]?.target
                .trim();

            return {
              operationId:
                operation.id,

              ...(target
                ? {
                    targetQuantity:
                      Number(
                        target,
                      ),
                  }
                : {}),
            };
          },
        );

    if (
      operationPayload.length ===
      0
    ) {
      setError(
        "حداقل یک عملیات را برای سری‌کار انتخاب کنید.",
      );

      return;
    }

    if (
      operationPayload.some(
        (
          item,
        ) =>
          item.targetQuantity !==
            undefined &&
          (
            !Number.isInteger(
              item.targetQuantity,
            ) ||
            item.targetQuantity <=
              0
          ),
      )
    ) {
      setError(
        "تعداد هدف عملیات باید عدد صحیح و مثبت باشد.",
      );

      return;
    }

    const input:
      CreateWorkBatchInput = {
        code:
          code.trim(),

        ownerId,

        modelName:
          modelName.trim(),

        totalQuantity:
          quantity,

        ownerPricingType:
          pricingType,

        ...(pricingType ===
        "PER_PIECE"
          ? {
              ownerUnitPrice:
                price,
            }
          : {
              ownerFixedAmount:
                price,
            }),

        ...(startDate
          ? {
              startDate,
            }
          : {}),

        ...(note.trim()
          ? {
              note:
                note.trim(),
            }
          : {}),

        operations:
          operationPayload,
      };

    setSaving(
      true,
    );

    setError(
      null,
    );

    try {
      await createWorkBatch(
        input,
      );

      setCode("");
      setOwnerId("");
      setModelName("");
      setTotalQuantity("");

      setPricingType(
        "PER_PIECE",
      );

      setPrice("");

      setStartDate(
        localToday(),
      );

      setNote("");
      setSelected({});

      await onCreated();
    } catch (
      caught
    ) {
      setError(
        managerError(
          caught,
        ),
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  if (
    !open
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
      />

      <div className="relative max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-base font-black">
              سری‌کار جدید
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              مشخصات سری را وارد کنید و عملیات‌های موردنیاز را از کاتالوگ تیک بزنید.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-4 rounded-[18px] border border-red-100 bg-red-50 p-4 text-xs font-bold leading-6 text-red-700">
              {error}
            </div>
          )}

          {optionsLoading ? (
            <div className="py-20 text-center">
              <LoaderCircle className="mx-auto size-7 animate-spin text-[var(--brand)]" />

              <p className="mt-3 text-xs font-bold text-[var(--muted)]">
                در حال دریافت صاحبکارها و عملیات...
              </p>
            </div>
          ) : (
            <form
              onSubmit={
                submit
              }
              className="space-y-6"
            >
              <section>
                <p className="mb-4 text-sm font-black">
                  مشخصات سری
                </p>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field
                    label="کد سری"
                  >
                    <input
                      dir="ltr"
                      value={
                        code
                      }
                      onChange={(
                        event,
                      ) =>
                        setCode(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                      placeholder="BG-001"
                    />
                  </Field>

                  <Field
                    label="صاحبکار"
                  >
                    <select
                      value={
                        ownerId
                      }
                      onChange={(
                        event,
                      ) =>
                        setOwnerId(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                    >
                      <option value="">
                        انتخاب صاحبکار
                      </option>

                      {owners.map(
                        (
                          owner,
                        ) => (
                          <option
                            key={
                              owner.id
                            }
                            value={
                              owner.id
                            }
                          >
                            {owner.name}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>

                  <Field
                    label="مدل شلوار"
                  >
                    <input
                      value={
                        modelName
                      }
                      onChange={(
                        event,
                      ) =>
                        setModelName(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                      placeholder="مثلاً مام‌فیت ۲۰۲۷"
                    />
                  </Field>

                  <Field
                    label="تعداد کل سری"
                  >
                    <input
                      dir="ltr"
                      inputMode="numeric"
                      value={
                        totalQuantity
                      }
                      onChange={(
                        event,
                      ) =>
                        setTotalQuantity(
                          event.target
                            .value
                            .replace(
                              /\D/g,
                              "",
                            ),
                        )
                      }
                      className={
                        inputClass
                      }
                      placeholder="100"
                    />
                  </Field>

                  <Field
                    label="تاریخ شروع"
                  >
                    <input
                      type="date"
                      dir="ltr"
                      value={
                        startDate
                      }
                      onChange={(
                        event,
                      ) =>
                        setStartDate(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--line)] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="size-4 text-[var(--brand)]" />

                  <p className="text-sm font-black">
                    قرارداد صاحبکار
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={
                      () => {
                        setPricingType(
                          "PER_PIECE",
                        );

                        setPrice(
                          "",
                        );
                      }
                    }
                    className={`rounded-[18px] border p-4 text-right ${
                      pricingType ===
                      "PER_PIECE"
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]/40"
                        : "border-[var(--line)]"
                    }`}
                  >
                    <p className="text-xs font-black">
                      قیمت دانه‌ای
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                      مبلغ هر شلوار × تعداد کل سری
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={
                      () => {
                        setPricingType(
                          "FIXED_TOTAL",
                        );

                        setPrice(
                          "",
                        );
                      }
                    }
                    className={`rounded-[18px] border p-4 text-right ${
                      pricingType ===
                      "FIXED_TOTAL"
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]/40"
                        : "border-[var(--line)]"
                    }`}
                  >
                    <p className="text-xs font-black">
                      مبلغ ثابت کل
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                      یک مبلغ نهایی برای کل سری
                    </p>
                  </button>
                </div>

                <div className="mt-4">
                  <Field
                    label={
                      pricingType ===
                      "PER_PIECE"
                        ? "قیمت هر عدد"
                        : "مبلغ کل سری"
                    }
                  >
                    <input
                      dir="ltr"
                      inputMode="numeric"
                      value={
                        price
                      }
                      onChange={(
                        event,
                      ) =>
                        setPrice(
                          event.target
                            .value
                            .replace(
                              /\D/g,
                              "",
                            ),
                        )
                      }
                      className={
                        inputClass
                      }
                      placeholder="مبلغ به تومان"
                    />
                  </Field>

                  {price && (
                    <p className="mt-2 text-xs font-black text-[var(--brand)]">
                      {pricingType ===
                      "PER_PIECE" &&
                      totalQuantity
                        ? `${money(
                            price,
                          )} × ${faNumber(
                            totalQuantity,
                          )} = ${money(
                            (
                              BigInt(
                                price,
                              ) *
                              BigInt(
                                totalQuantity,
                              )
                            ).toString(),
                          )}`
                        : money(
                            price,
                          )}
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--line)] p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">
                      عملیات‌های این سری
                    </p>

                    <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
                      تمام عملیات‌های فعال به‌صورت پیش‌فرض اینجا هستند؛ فقط موارد لازم را تیک بزنید.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[10px] font-black text-[var(--brand)]">
                    {faNumber(
                      selectedCount,
                    )} انتخاب
                  </span>
                </div>

                {operations.length ===
                0 ? (
                  <div className="rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800">
                    هنوز عملیات فعالی وجود ندارد. پایین همین فرم می‌توانید اولین عملیات را اضافه کنید.
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {operations.map(
                      (
                        operation,
                      ) => {
                        const state =
                          selected[
                            operation.id
                          ] ?? {
                            selected:
                              false,
                            target:
                              "",
                          };

                        return (
                          <div
                            key={
                              operation.id
                            }
                            className={`rounded-[20px] border p-3 transition ${
                              state.selected
                                ? "border-[var(--brand)] bg-[var(--brand-soft)]/30"
                                : "border-[var(--line)] bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={
                                () =>
                                  setSelected(
                                    (
                                      current,
                                    ) => ({
                                      ...current,

                                      [operation.id]: {
                                        ...state,

                                        selected:
                                          !state.selected,
                                      },
                                    }),
                                  )
                              }
                              className="flex w-full items-center justify-between gap-3 text-right"
                            >
                              <div>
                                <p className="text-xs font-black">
                                  {operation.name}
                                </p>

                                <p className="mt-1 text-[9px] text-[var(--muted)]">
                                  نرخ فعلی:{" "}
                                  {operation.currentRate
                                    ? money(
                                        operation.currentRate,
                                      )
                                    : "بدون نرخ"}
                                </p>
                              </div>

                              <span
                                className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${
                                  state.selected
                                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {state.selected && (
                                  <Check className="size-4" />
                                )}
                              </span>
                            </button>

                            {state.selected && (
                              <div className="mt-3 border-t border-[var(--line)] pt-3">
                                <label className="mb-1.5 block text-[9px] font-black text-[var(--muted)]">
                                  تعداد هدف این عملیات
                                </label>

                                <input
                                  dir="ltr"
                                  inputMode="numeric"
                                  value={
                                    state.target
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setSelected(
                                      (
                                        current,
                                      ) => ({
                                        ...current,

                                        [operation.id]: {
                                          selected:
                                            true,

                                          target:
                                            event.target
                                              .value
                                              .replace(
                                                /\D/g,
                                                "",
                                              ),
                                        },
                                      }),
                                    )
                                  }
                                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-center text-xs font-black outline-none focus:border-[var(--brand)]"
                                  placeholder={
                                    totalQuantity
                                      ? `خالی = ${faNumber(
                                          totalQuantity,
                                        )}`
                                      : "خالی = تعداد کل سری"
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-[20px] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-center gap-2">
                    <Plus className="size-4 text-[var(--brand)]" />

                    <p className="text-xs font-black">
                      عملیات جدید پیدا نکردید؟
                    </p>
                  </div>

                  <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                    همین‌جا بسازید؛ به کاتالوگ اصلی اضافه می‌شود و برای سری‌های آینده هم باقی می‌ماند.
                  </p>

                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_190px_auto]">
                    <input
                      value={
                        newOperationName
                      }
                      onChange={(
                        event,
                      ) =>
                        setNewOperationName(
                          event.target
                            .value,
                        )
                      }
                      className={
                        inputClass
                      }
                      placeholder="نام عملیات جدید"
                    />

                    <input
                      dir="ltr"
                      inputMode="numeric"
                      value={
                        newOperationRate
                      }
                      onChange={(
                        event,
                      ) =>
                        setNewOperationRate(
                          event.target
                            .value
                            .replace(
                              /\D/g,
                              "",
                            ),
                        )
                      }
                      className={
                        inputClass
                      }
                      placeholder="نرخ اولیه"
                    />

                    <button
                      type="button"
                      disabled={
                        addingOperation
                      }
                      onClick={
                        () => {
                          void addInlineOperation();
                        }
                      }
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#102827] px-4 text-xs font-black text-white disabled:opacity-50"
                    >
                      {addingOperation ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Scissors className="size-4" />
                      )}

                      اضافه
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <Field
                  label="توضیحات سری"
                >
                  <textarea
                    rows={
                      3
                    }
                    maxLength={
                      1000
                    }
                    value={
                      note
                    }
                    onChange={(
                      event,
                    ) =>
                      setNote(
                        event.target
                          .value,
                      )
                    }
                    className={
                      textareaClass
                    }
                    placeholder="اختیاری..."
                  />
                </Field>
              </section>

              <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-[var(--line)] bg-white/95 p-5 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] text-sm font-black text-white shadow-[0_12px_30px_rgba(13,116,109,.16)] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      در حال ساخت سری...
                    </>
                  ) : (
                    <>
                      <PackagePlus className="size-4" />
                      ساخت سری‌کار
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black">
        {label}
      </label>

      {children}
    </div>
  );
}

function StatBox({
  label,
  value,
  active =
    false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-white p-4">
      <p className="text-[10px] text-[var(--muted)]">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-black ${
          active
            ? "text-emerald-700"
            : ""
        }`}
      >
        {faNumber(
          value,
        )}
      </p>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[9px] text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-black">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-soft)] p-2">
      <p className="text-[8px] text-[var(--muted)]">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-black">
        {faNumber(
          value,
        )}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    BatchStatus;
}) {
  const className =
    status ===
    "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status ===
          "COMPLETED"
        ? "bg-blue-50 text-blue-700"
        : status ===
            "CANCELLED"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-black ${className}`}
    >
      {statusLabels[
        status
      ]}
    </span>
  );
}