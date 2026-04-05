import { redirect } from "next/navigation";

export const metadata = {
  title: "Streak",
};

export default function StreakPage() {
  redirect("/today");
}
