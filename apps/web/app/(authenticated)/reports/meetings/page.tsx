"use client";

import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { MeetingsReport } from "@/src/features/reports/components/meetings-report";

export default function MeetingsReportPage() {
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <MeetingsReport />
      </Suspense>
    </Can>
  );
}
