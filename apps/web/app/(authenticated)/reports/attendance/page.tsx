"use client";

import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { AttendanceReport } from "@/src/features/reports/components/attendance-report";

export default function AttendanceReportPage() {
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <AttendanceReport />
      </Suspense>
    </Can>
  );
}
