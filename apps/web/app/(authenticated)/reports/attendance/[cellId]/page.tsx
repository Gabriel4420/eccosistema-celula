"use client";

import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { AttendanceDetail } from "@/src/features/reports/components/attendance-detail";

export default function AttendanceDetailPage({
  params,
}: {
  readonly params: { readonly cellId: string };
}) {
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <AttendanceDetail cellId={params.cellId} />
      </Suspense>
    </Can>
  );
}
