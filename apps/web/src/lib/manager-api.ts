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

    return caught.message;
  }

  return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
}