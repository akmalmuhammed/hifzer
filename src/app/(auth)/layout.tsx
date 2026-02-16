export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="mx-auto w-full max-w-[520px] px-4 py-12">
      {children}
    </main>
  );
}
