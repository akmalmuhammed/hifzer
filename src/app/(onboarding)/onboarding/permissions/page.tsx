import { redirect } from "next/navigation";

export const metadata = {
  title: "Permissions",
};

export default function OnboardingPermissionsPage() {
  redirect("/onboarding/assessment");
}
