import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding",
};

export default function OnboardingWelcomePage() {
  redirect("/onboarding/assessment");
}
