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
  items: PersonnelItem[];
  pagination: Pagination;
};

export type PersonnelInput = {
  fullName: string;
  phone: string;
  role: UserRole;
  defaultMonthlySalary?: string;
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

    return caught.message;
  }

  return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
}