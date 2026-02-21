import { PublicBetaBanner } from "@/components/site/public-beta-banner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicBetaBanner />
      <main id="main-content" className="mx-auto w-full max-w-[520px] px-4 py-12">
        {children}
      </main>
    </>
  );
}
