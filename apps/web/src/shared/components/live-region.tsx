import type { ReactNode } from "react";

interface LiveRegionProps {
  readonly children: ReactNode;
  readonly polite?: boolean;
}

export function LiveRegion({ children, polite = true }: LiveRegionProps) {
  return (
    <div aria-live={polite ? "polite" : "assertive"} aria-atomic="true" className="visually-hidden">
      {children}
    </div>
  );
}
