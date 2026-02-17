"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function BillingSuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/today");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  return null;
}

