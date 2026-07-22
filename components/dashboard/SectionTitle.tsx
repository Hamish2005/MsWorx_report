import type { ReactNode } from "react";

export function SectionTitle({ title, children }: { title: string; children: ReactNode }) {
  return <>
    <h2>{title}</h2>
    <div className="sectionSub">{children}</div>
  </>;
}
