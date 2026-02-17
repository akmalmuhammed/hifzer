import { CommandPalette } from "@/components/shell/command-palette";
import { DemoAuthProvider } from "@/demo/demo-auth";
import { DemoStoreProvider } from "@/demo/store";
import { TeamProvider } from "@/demo/team";

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoAuthProvider>
      <DemoStoreProvider>
        <TeamProvider>
          {children}
          <CommandPalette />
        </TeamProvider>
      </DemoStoreProvider>
    </DemoAuthProvider>
  );
}

