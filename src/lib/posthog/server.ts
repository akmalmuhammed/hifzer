import "server-only";

function posthogKey(): string | null {
  const value = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!value || !value.trim()) {
    return null;
  }
  return value.trim();
}

function posthogHost(): string {
  const value = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!value || !value.trim()) {
    return "https://us.i.posthog.com";
  }
  return value.trim();
}

export async function captureServerPosthogEvent(event: string, properties: Record<string, unknown>) {
  const key = posthogKey();
  if (!key) {
    return;
  }
  try {
    await fetch(`${posthogHost().replace(/\/+$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        properties: {
          distinct_id: "hifzer-email-cron",
          source: "server",
          ...properties,
        },
      }),
    });
  } catch {
    // Observability capture should never block product flows.
  }
}
