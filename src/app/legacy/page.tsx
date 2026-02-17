import { redirect } from "next/navigation";

export default function LegacyIndexPage() {
  redirect("/legacy/app");
}

