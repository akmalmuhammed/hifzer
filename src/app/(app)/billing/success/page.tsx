import { redirect } from "next/navigation";

export default function BillingSuccessPage() {
  redirect("/billing/thank-you");
}
