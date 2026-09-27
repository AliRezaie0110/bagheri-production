import {
  ApiError,
  apiFetch,
} from "@/lib/api";

import type {
  UserRole,
} from "@/lib/auth";

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type QueryValue =
  | string
  | number
  | boolean
  | undefined;

function queryPath(
  path: string,
  values: Record<
    string,
    QueryValue
  >,
): string {
  const params =
    new URLSearchParams();

  Object.entries(
    values,
  ).forEach(
    ([
      key,
      value,
    ]) => {
      if (
        value === undefined ||
        value === ""
      ) {
        return;
      }

      params.set(
        key,
        String(
          value,
        ),
      );
    },
  );

  const query =
    params.toString();

  return query
    ? `${path}?${query}`
    : path;
}

// =========================================================
// PERSONNEL
// =========================================================

export type PersonnelItem = {
  id: string;
  phone: string;
  fullName: string;
  role: UserRole;

  compensationType:
    | "NONE"
    | "PIECE_RATE"
    | "FIXED_MONTHLY";

  isActive: boolean;

  defaultMonthlySalary:
    | string
    | null;

  phoneVerifiedAt:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
};

export type PersonnelListResponse = {
  items:
    PersonnelItem[];

  pagination:
    Pagination;
};

export type PersonnelInput = {
  fullName: string;
  phone: string;
  role: UserRole;
  defaultMonthlySalary?: string;
};

export function listPersonnel(
  params: {
    q?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PersonnelListResponse> {
  return apiFetch<PersonnelListResponse>(
    queryPath(
      "/admin/personnel",
      params,
    ),
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function createPersonnel(
  input:
    PersonnelInput,
): Promise<PersonnelItem> {
  return apiFetch<PersonnelItem>(
    "/admin/personnel",
    {
      method:
        "POST",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function updatePersonnel(
  id: string,
  input:
    Partial<PersonnelInput>,
): Promise<PersonnelItem> {
  return apiFetch<PersonnelItem>(
    `/admin/personnel/${id}`,
    {
      method:
        "PATCH",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function setPersonnelActive(
  id: string,
  active: boolean,
): Promise<PersonnelItem> {
  return apiFetch<PersonnelItem>(
    `/admin/personnel/${id}/${
      active
        ? "activate"
        : "deactivate"
    }`,
    {
      method:
        "POST",
      body:
        JSON.stringify({}),
    },
  );
}

// =========================================================
// OWNERS
// =========================================================

export type OwnerItem = {
  id: string;
  name: string;

  phone:
    | string
    | null;

  note:
    | string
    | null;

  isActive: boolean;
};

export type OwnerListResponse = {
  items:
    OwnerItem[];
};

export type OwnerInput = {
  name: string;
  phone?: string;
  note?: string;
};

export function listOwners(
  params: {
    q?: string;
    isActive?: boolean;
  } = {},
): Promise<OwnerListResponse> {
  return apiFetch<OwnerListResponse>(
    queryPath(
      "/admin/owners",
      params,
    ),
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function createOwner(
  input:
    OwnerInput,
): Promise<OwnerItem> {
  return apiFetch<OwnerItem>(
    "/admin/owners",
    {
      method:
        "POST",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function updateOwner(
  id: string,
  input:
    Partial<OwnerInput>,
): Promise<OwnerItem> {
  return apiFetch<OwnerItem>(
    `/admin/owners/${id}`,
    {
      method:
        "PATCH",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function setOwnerActive(
  id: string,
  active: boolean,
): Promise<OwnerItem> {
  return apiFetch<OwnerItem>(
    `/admin/owners/${id}/${
      active
        ? "activate"
        : "deactivate"
    }`,
    {
      method:
        "POST",
      body:
        JSON.stringify({}),
    },
  );
}

// =========================================================
// OPERATIONS + RATE HISTORY
// =========================================================

export type OperationItem = {
  id: string;
  name: string;
  isActive: boolean;

  currentRate:
    | string
    | null;

  currentRateEffectiveFrom:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
};

export type OperationRateHistory = {
  id: string;
  amount: string;
  effectiveFrom: string;

  effectiveTo:
    | string
    | null;
};

export type OperationDetail =
  OperationItem & {
    rateHistory:
      OperationRateHistory[];
  };

export type OperationsResponse = {
  items:
    OperationItem[];
};

export type OperationChecklistItem =
  OperationItem & {
    selected: boolean;
  };

export type OperationChecklistResponse = {
  items:
    OperationChecklistItem[];
};

export function listOperations(
  includeInactive =
    false,
): Promise<OperationsResponse> {
  return apiFetch<OperationsResponse>(
    queryPath(
      "/admin/operations",
      {
        includeInactive,
      },
    ),
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function getOperationChecklist(): Promise<OperationChecklistResponse> {
  return apiFetch<OperationChecklistResponse>(
    "/admin/operations/checklist",
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function getOperation(
  id: string,
): Promise<OperationDetail> {
  return apiFetch<OperationDetail>(
    `/admin/operations/${id}`,
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function createOperation(
  input: {
    name: string;
    initialRate: string;
  },
): Promise<OperationItem> {
  return apiFetch<OperationItem>(
    "/admin/operations",
    {
      method:
        "POST",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function updateOperation(
  id: string,
  input: {
    name?: string;
    isActive?: boolean;
  },
): Promise<OperationItem> {
  return apiFetch<OperationItem>(
    `/admin/operations/${id}`,
    {
      method:
        "PATCH",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function changeOperationRate(
  id: string,
  amount: string,
): Promise<{
  operationId: string;
  amount: string;
  effectiveFrom: string;
}> {
  return apiFetch(
    `/admin/operations/${id}/rates`,
    {
      method:
        "POST",
      body:
        JSON.stringify({
          amount,
        }),
    },
  );
}

// =========================================================
// WORK BATCHES
// =========================================================

export type BatchStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type OwnerPricingType =
  | "PER_PIECE"
  | "FIXED_TOTAL";

export type BatchOperationItem = {
  batchOperationId: string;
  operationId: string;
  name: string;
  isOperationActive: boolean;
  targetQuantity: number;
  claimedQuantity: number;
  approvedQuantity: number;
  remainingQuantity: number;
};

export type WorkBatchItem = {
  id: string;
  code: string;

  owner:
    | {
        id: string;
        name: string;
        isActive: boolean;
      }
    | null;

  modelName: string;
  totalQuantity: number;

  ownerPricingType:
    OwnerPricingType;

  ownerUnitPrice:
    | string
    | null;

  ownerFixedAmount:
    | string
    | null;

  status:
    BatchStatus;

  startDate:
    | string
    | null;

  completedAt:
    | string
    | null;

  note:
    | string
    | null;

  operations:
    BatchOperationItem[];
};

export type WorkBatchListResponse = {
  items:
    WorkBatchItem[];

  pagination:
    Pagination;
};

export type CreateWorkBatchInput = {
  code: string;
  ownerId: string;
  modelName: string;
  totalQuantity: number;

  ownerPricingType:
    OwnerPricingType;

  ownerUnitPrice?: string;
  ownerFixedAmount?: string;
  startDate?: string;
  note?: string;

  operations: Array<{
    operationId: string;
    targetQuantity?: number;
  }>;
};

export function listBatches(
  params: {
    q?: string;
    ownerId?: string;
    status?: BatchStatus;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<WorkBatchListResponse> {
  return apiFetch<WorkBatchListResponse>(
    queryPath(
      "/admin/batches",
      params,
    ),
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function getBatch(
  id: string,
): Promise<WorkBatchItem> {
  return apiFetch<WorkBatchItem>(
    `/admin/batches/${id}`,
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function createWorkBatch(
  input:
    CreateWorkBatchInput,
): Promise<WorkBatchItem> {
  return apiFetch<WorkBatchItem>(
    "/admin/batches",
    {
      method:
        "POST",
      body:
        JSON.stringify(
          input,
        ),
    },
  );
}

export function changeBatchStatus(
  id: string,
  status:
    BatchStatus,
): Promise<WorkBatchItem> {
  return apiFetch<WorkBatchItem>(
    `/admin/batches/${id}/status`,
    {
      method:
        "PATCH",
      body:
        JSON.stringify({
          status,
        }),
    },
  );
}
// =========================================================
// EMPLOYEE ACCOUNTS
// =========================================================

export type PaymentMethod =
  | "CARD_TO_CARD"
  | "BANK_TRANSFER"
  | "CASH"
  | "OTHER";

export type EmployeeAccountSummary = {
  id: string;
  fullName: string;
  phone: string;

  role:
    | "WORKER"
    | "SUPERVISOR"
    | "ASSISTANT";

  compensationType:
    | "PIECE_RATE"
    | "FIXED_MONTHLY";

  isActive: boolean;

  defaultMonthlySalary:
    | string
    | null;

  earned: string;
  pending: string;
  paid: string;
  balance: string;

  approvedWorkEntries: number;
  pendingWorkEntries: number;
};

export type EmployeeAccountsResponse = {
  items:
    EmployeeAccountSummary[];

  pagination:
    Pagination;
};

export type EmployeePaymentItem = {
  id: string;
  amount: string;

  paymentMethod:
    PaymentMethod;

  paidAt: string;

  note:
    | string
    | null;

  hasReceipt: boolean;

  receiptOriginalName:
    | string
    | null;

  recordedBy: {
    id: string;
    fullName: string;
  };

  createdAt: string;
};

export type EmployeeAccountDetail = {
  employee: {
    id: string;
    fullName: string;
    phone: string;

    role:
      | "WORKER"
      | "SUPERVISOR"
      | "ASSISTANT";

    compensationType:
      | "PIECE_RATE"
      | "FIXED_MONTHLY";

    isActive: boolean;

    defaultMonthlySalary:
      | string
      | null;
  };

  totals: {
    earned: string;
    pending: string;
    paid: string;
    balance: string;
    approvedWorkEntries: number;
    pendingWorkEntries: number;
  };

  monthlySalaries: Array<{
    id: string;
    year: number;
    month: number;
    amount: string;

    note:
      | string
      | null;
  }>;

  payments:
    EmployeePaymentItem[];
};

export type RecordEmployeePaymentInput = {
  amount: string;
  paymentMethod:
    PaymentMethod;

  note?: string;

  receipt?:
    File;
};

export function listEmployeeAccounts(
  params: {
    q?: string;

    role?:
      | "WORKER"
      | "SUPERVISOR"
      | "ASSISTANT";

    isActive?: boolean;

    page?: number;
    pageSize?: number;
  } = {},
): Promise<EmployeeAccountsResponse> {
  return apiFetch<EmployeeAccountsResponse>(
    queryPath(
      "/admin/employee-accounts",
      params,
    ),
    {
      method:
        "GET",

      cache:
        "no-store",
    },
  );
}

export function getEmployeeAccount(
  employeeId: string,
): Promise<EmployeeAccountDetail> {
  return apiFetch<EmployeeAccountDetail>(
    `/admin/employee-accounts/${employeeId}`,
    {
      method:
        "GET",

      cache:
        "no-store",
    },
  );
}

const MANAGER_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

async function managerRawFetch(
  path: string,
  init:
    RequestInit,
): Promise<Response> {
  const response =
    await fetch(
      `${MANAGER_API_URL}${path}`,
      {
        ...init,

        credentials:
          "include",
      },
    );

  if (
    response.ok
  ) {
    return response;
  }

  let message =
    `خطای سرور (${response.status})`;

  try {
    const payload =
      await response.json() as {
        message?:
          | string
          | string[];
      };

    if (
      Array.isArray(
        payload.message,
      )
    ) {
      message =
        payload.message.join(
          "، ",
        );
    } else if (
      typeof payload.message ===
      "string"
    ) {
      message =
        payload.message;
    }
  } catch {
    // Response can be empty.
  }

  throw new Error(
    message,
  );
}

export async function recordEmployeePayment(
  employeeId: string,
  input:
    RecordEmployeePaymentInput,
): Promise<void> {
  const form =
    new FormData();

  form.append(
    "amount",
    input.amount,
  );

  form.append(
    "paymentMethod",
    input.paymentMethod,
  );

  if (
    input.note?.trim()
  ) {
    form.append(
      "note",
      input.note.trim(),
    );
  }

  if (
    input.receipt
  ) {
    form.append(
      "receipt",
      input.receipt,
    );
  }

  await managerRawFetch(
    `/admin/employee-accounts/${employeeId}/payments`,
    {
      method:
        "POST",

      body:
        form,
    },
  );
}

async function fetchManagerReceipt(
  paymentId: string,
): Promise<Blob> {
  const response =
    await managerRawFetch(
      `/admin/employee-accounts/payments/${paymentId}/receipt`,
      {
        method:
          "GET",
      },
    );

  return response.blob();
}

export async function openManagerEmployeeReceipt(
  paymentId: string,
): Promise<void> {
  const blob =
    await fetchManagerReceipt(
      paymentId,
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );

  window.setTimeout(
    () => {
      URL.revokeObjectURL(
        url,
      );
    },
    60_000,
  );
}

export async function shareManagerEmployeeReceipt(
  paymentId: string,
  employeeName: string,
): Promise<void> {
  const blob =
    await fetchManagerReceipt(
      paymentId,
    );

  const extension =
    blob.type ===
    "application/pdf"
      ? "pdf"
      : blob.type ===
          "image/png"
        ? "png"
        : "jpg";

  const file =
    new File(
      [
        blob,
      ],
      `receipt-${paymentId}.${extension}`,
      {
        type:
          blob.type,
      },
    );

  try {
    if (
      navigator.share
    ) {
      await navigator.share({
        title:
          `رسید پرداخت ${employeeName}`,

        text:
          `رسید پرداخت ${employeeName}`,

        files: [
          file,
        ],
      });

      return;
    }
  } catch (
    error
  ) {
    if (
      error instanceof
        DOMException &&
      error.name ===
        "AbortError"
    ) {
      return;
    }
  }

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    url;

  anchor.download =
    `receipt-${paymentId}.${extension}`;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}
// =========================================================
// ERROR MAPPING
// =========================================================

export function managerError(
  caught: unknown,
): string {
  if (
    caught instanceof
    ApiError
  ) {
    if (
      caught.code ===
      "ACTIVE_SUPERVISOR_EXISTS"
    ) {
      return "در حال حاضر یک سرپرست فعال وجود دارد.";
    }

    if (
      caught.code ===
      "PHONE_ALREADY_EXISTS"
    ) {
      return "این شماره موبایل قبلاً ثبت شده است.";
    }

    if (
      caught.code ===
      "MONTHLY_SALARY_REQUIRED"
    ) {
      return "برای سرپرست و وردست، حقوق ماهانه الزامی است.";
    }

    if (
      caught.code ===
        "MANAGER_PROTECTED" ||
      caught.code ===
        "MANAGER_ROLE_PROTECTED"
    ) {
      return "حساب یا نقش مدیر از این بخش قابل تغییر نیست.";
    }

    if (
      caught.code ===
      "PERSONNEL_NOT_FOUND"
    ) {
      return "پرسنل موردنظر پیدا نشد.";
    }

    if (
      caught.code ===
      "OWNER_NOT_FOUND"
    ) {
      return "صاحبکار موردنظر پیدا نشد.";
    }

    if (
      caught.code ===
      "OPERATION_ALREADY_EXISTS"
    ) {
      return "عملیاتی با این نام قبلاً ثبت شده است.";
    }

    if (
      caught.code ===
      "OPERATION_NOT_FOUND"
    ) {
      return "عملیات موردنظر پیدا نشد.";
    }

    if (
      caught.code ===
      "BATCH_NOT_FOUND"
    ) {
      return "سری‌کار موردنظر پیدا نشد.";
    }

    if (
      caught.code ===
      "BATCH_CODE_ALREADY_EXISTS"
    ) {
      return "این کد سری‌کار قبلاً ثبت شده است.";
    }

    if (
      caught.code ===
      "OWNER_NOT_ACTIVE"
    ) {
      return "صاحبکار انتخاب‌شده فعال نیست.";
    }

    if (
      caught.code ===
      "OWNER_UNIT_PRICE_REQUIRED"
    ) {
      return "برای قرارداد دانه‌ای، قیمت هر عدد الزامی است.";
    }

    if (
      caught.code ===
      "OWNER_FIXED_AMOUNT_REQUIRED"
    ) {
      return "برای قرارداد مبلغ ثابت، مبلغ کل الزامی است.";
    }

    if (
      caught.code ===
      "INVALID_BATCH_OPERATIONS"
    ) {
      return "یک یا چند عملیات انتخاب‌شده غیرفعال یا نامعتبر است.";
    }

    if (
      caught.code ===
      "DUPLICATE_BATCH_OPERATION"
    ) {
      return "یک عملیات بیش از یک بار در سری انتخاب شده است.";
    }

    return caught.message;
  }

  if (
    caught instanceof
    Error &&
    caught.message
  ) {
    return caught.message;
  }

  return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
}