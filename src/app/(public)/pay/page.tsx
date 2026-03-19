import { PaddleProvider } from "@/components/billing/paddle-provider";
import { PaymentLinkClient } from "./payment-link-client";

export const metadata = {
  title: "Secure Checkout",
  robots: {
    index: false,
    follow: false,
  },
};

function readSingle(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const trimmed = item.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

export default async function PaymentLinkPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const transactionId = readSingle(searchParams._ptxn);

  return (
    <PaddleProvider>
      <PaymentLinkClient transactionId={transactionId} />
    </PaddleProvider>
  );
}
