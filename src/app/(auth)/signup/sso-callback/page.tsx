import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Signup Callback",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SSOCallbackPage() {
  if (!clerkEnabled()) {
    redirect("/signup");
  }
  return <AuthenticateWithRedirectCallback />;
}
