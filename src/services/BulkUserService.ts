import { api } from '@/lib/api-client';
import { User } from '@/types';

export type BulkUserSubmissionItem = { email?: string; id?: string | number; index?: number };
export type BulkUserFailedItem = { email?: string; errors?: string[]; index?: number };

export type BulkUserSubmissionResult = {
  created: BulkUserSubmissionItem[];
  updated: BulkUserSubmissionItem[];
  existing: BulkUserSubmissionItem[];
  failed: BulkUserFailedItem[];
};

type BackendBulkResponse = {
  status: boolean;
  message?: string;
  data?: {
    created?: BulkUserSubmissionItem[];
    updated?: BulkUserSubmissionItem[];
    existing?: BulkUserSubmissionItem[];
    failed?: BulkUserFailedItem[];
  };
  pagination?: {
    totalProcessed?: number;
    created?: number;
    updated?: number;
    existing?: number;
    failed?: number;
  };
};

function toBatches<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

export const BulkUserService = {
  bulkUpsertUsers: async (
    users: Partial<User>[],
    options?: { batchSize?: number }
  ): Promise<BulkUserSubmissionResult> => {
    const batchSize = Math.max(1, Math.min(options?.batchSize ?? 50, 50));

    if (!Array.isArray(users) || users.length === 0) {
      return { created: [], updated: [], existing: [], failed: [] };
    }

    const batches = toBatches(users, batchSize);
    const offsets: number[] = batches.reduce<number[]>((acc, batch, i) => {
      const prev = i === 0 ? 0 : acc[i - 1] + batches[i - 1].length;
      acc.push(prev);
      return acc;
    }, []);

    const requests = batches.map((batch) =>
      api.post<BackendBulkResponse>('/api/users/bulk-upsert', { users: batch })
    );

    const settled = await Promise.allSettled(requests);

    const aggregate: BulkUserSubmissionResult = {
      created: [],
      updated: [],
      existing: [],
      failed: [],
    };

    settled.forEach((result, idx) => {
      const batch = batches[idx];
      const offset = offsets[idx] ?? 0;
      if (result.status === 'fulfilled') {
        const body = result.value;
        const data = body?.data || {};
        if (Array.isArray(data.created)) {
          aggregate.created.push(
            ...data.created.map((it, i) => ({ ...it, index: (it.index ?? i) + offset }))
          );
        }
        if (Array.isArray(data.updated)) {
          aggregate.updated.push(
            ...data.updated.map((it, i) => ({ ...it, index: (it.index ?? i) + offset }))
          );
        }
        if (Array.isArray(data.existing)) {
          aggregate.existing.push(
            ...data.existing.map((it, i) => ({ ...it, index: (it.index ?? i) + offset }))
          );
        }
        if (Array.isArray(data.failed)) {
          aggregate.failed.push(
            ...data.failed.map((it, i) => ({ ...it, index: (it.index ?? i) + offset }))
          );
        }
      } else {
        // Request-level failure: mark all rows in this batch as failed with the reason
        const errorMsg = (result.reason && (result.reason.message || String(result.reason))) || 'REQUEST_FAILED';
        batch.forEach((u, i) => {
          aggregate.failed.push({ email: (u.email as string) || undefined, errors: [errorMsg], index: i + offset });
        });
      }
    });

    return aggregate;
  },
};

export default BulkUserService;


