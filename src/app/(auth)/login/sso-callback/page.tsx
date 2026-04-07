import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Login Callback",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SSOCallbackPage() {
  if (!clerkEnabled()) {
    redirect("/login");
  }
  return <AuthenticateWithRedirectCallback />;
}
