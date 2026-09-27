import {
  apiFetch,
} from "@/lib/api";

export type WorkEntryStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type AvailableWorkItem = {
  batchOperationId: string;
  batchId: string;
  batchCode: string;
  modelName: string;
  operationId: string;
  operationName: string;
  targetQuantity: number;
  claimedQuantity: number;
  approvedQuantity: number;
  remainingQuantity: number;
  currentRate: string | null;
};

export type WorkerAvailableResponse = {
  items: AvailableWorkItem[];
};

export type WorkerHistoryEntry = {
  id: string;
  batchOperationId: string;
  batchId: string;
  batchCode: string;
  modelName: string;
  operationId: string;
  operationName: string;
  quantity: number;
  unitRate: string;
  totalAmount: string;
  status: WorkEntryStatus;
  workerNote: string | null;
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type WorkerHistoryResponse = {
  items: WorkerHistoryEntry[];
};

export type EmployeePayment = {
  id: string;
  amount: string;
  paidAt: string;
  note: string | null;
  recordedBy: {
    id: string;
    fullName: string;
  };
  createdAt: string;
};

export type EmployeeAccountResponse = {
  employee: {
    id: string;
    fullName: string;
    phone: string;
    role: string;
    compensationType: string;
    isActive: boolean;
    defaultMonthlySalary: string | null;
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
    note: string | null;
  }>;

  payments: EmployeePayment[];
};

export type CreateWorkerEntryInput = {
  batchOperationId: string;
  quantity: number;
  workerNote?: string;
};

export function getAvailableWork(): Promise<WorkerAvailableResponse> {
  return apiFetch<WorkerAvailableResponse>(
    "/work-entries/available",
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function getWorkerHistory(): Promise<WorkerHistoryResponse> {
  return apiFetch<WorkerHistoryResponse>(
    "/work-entries/mine",
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function getWorkerAccount(): Promise<EmployeeAccountResponse> {
  return apiFetch<EmployeeAccountResponse>(
    "/employee-account/mine",
    {
      method:
        "GET",
      cache:
        "no-store",
    },
  );
}

export function createWorkerEntry(
  input: CreateWorkerEntryInput,
): Promise<unknown> {
  return apiFetch(
    "/work-entries",
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