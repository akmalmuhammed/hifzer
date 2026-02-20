"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ua = window.navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (typeof window === "undefined" || !window.isSecureContext) {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }
    if (!isMobileDevice()) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
      } catch {
        // Fail open: web app works without offline caching if registration fails.
      }
    };

    if (document.readyState === "complete") {
      void register();
      return;
    }

    const onLoad = () => {
      void register();
    };
    window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
