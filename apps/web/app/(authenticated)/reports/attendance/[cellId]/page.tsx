"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { AttendanceDetail } from "@/src/features/reports/components/attendance-detail";

export default function AttendanceDetailPage() {
  const { cellId } = useParams<{ cellId: string }>();
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <AttendanceDetail cellId={cellId} />
      </Suspense>
    </Can>
  );
}
