import { ProtectedLayout } from "@/components/shell/protected-layout";

export default function LegacyAppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

