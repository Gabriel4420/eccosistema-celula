import { Skeleton } from "@/src/shared/components";

export default function AuthenticatedLoading() {
  return (
    <div aria-label="Carregando conteúdo" className="page-header">
      <Skeleton width="40%" height="2.5rem" />
      <Skeleton width="100%" height="8rem" />
    </div>
  );
}
