"use client";

import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { PendingReports } from "@/src/features/reports/components/pending-reports";

export default function PendingReportsPage() {
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <PendingReports />
      </Suspense>
    </Can>
  );
}
