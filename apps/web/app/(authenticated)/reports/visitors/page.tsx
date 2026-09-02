"use client";

import { Suspense } from "react";
import { Skeleton } from "@/src/shared/components";
import { Can } from "@/src/shared/auth/guards";
import { VisitorReport } from "@/src/features/reports/components/visitor-report";

export default function VisitorReportPage() {
  return (
    <Can capability="viewReports">
      <Suspense fallback={<Skeleton width="100%" height="5rem" />}>
        <VisitorReport />
      </Suspense>
    </Can>
  );
}
