"use client";

import { Skeleton } from "@/src/shared/components";
import { useI18n } from "@/src/shared/i18n/language-provider";

export default function AuthenticatedLoading() {
  const { t } = useI18n();
  return (
    <div aria-label={t("common.loadingContent")} className="page-header">
      <Skeleton width="40%" height="2.5rem" />
      <Skeleton width="100%" height="8rem" />
    </div>
  );
}
