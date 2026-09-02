"use client";

import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { ReportsHub } from "@/src/features/reports/components/reports-hub";

export default function ReportsPage() {
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <ReportsHub />
      </Suspense>
    </Can>
  );
}
