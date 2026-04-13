import type { ReactNode } from "react";
import { quranFont } from "@/lib/fonts";

export default function DuaLayout({ children }: { children: ReactNode }) {
  return <div className={quranFont.variable}>{children}</div>;
}
