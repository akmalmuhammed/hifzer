import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

export default function TodayRedirectPage() {
  redirect("/dashboard");
}
