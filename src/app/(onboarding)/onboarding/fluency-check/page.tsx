import { redirect } from "next/navigation";

export const metadata = {
  title: "Fluency Check",
};

export default function OnboardingFluencyCheckPage() {
  redirect("/onboarding/assessment");
}
