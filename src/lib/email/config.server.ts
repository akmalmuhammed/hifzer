import "server-only";

type EmailProviderName = "resend";

type EmailConfig = {
  provider: EmailProviderName;
  resendApiKey: string;
  from: string;
  replyTo: string | null;
  dryRun: boolean;
  dailyCap: number;
  monthlyCap: number;
  unsubscribeSigningSecret: string;
  cronSecret: string;
  appUrl: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function optional(name: string): string | null {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return null;
  }
  return value.trim();
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) {
    return fallback;
  }
  const value = raw.trim().toLowerCase();
  if (value === "1" || value === "true" || value === "yes") {
    return true;
  }
  if (value === "0" || value === "false" || value === "no") {
    return false;
  }
  return fallback;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

function assertEmailAddressLike(input: string, envKey: string) {
  if (!input.includes("@")) {
    throw new Error(`${envKey} must contain a valid email address.`);
  }
}

let cached: EmailConfig | null = null;

export function emailConfig(): EmailConfig {
  if (cached) {
    return cached;
  }

  const providerRaw = (process.env.EMAIL_PROVIDER ?? "resend").trim().toLowerCase();
  if (providerRaw !== "resend") {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${providerRaw}`);
  }

  const resendApiKey = required("RESEND_API_KEY");
  const from = required("EMAIL_FROM");
  const replyTo = optional("EMAIL_REPLY_TO");
  const unsubscribeSigningSecret = required("EMAIL_UNSUBSCRIBE_SIGNING_SECRET");
  const cronSecret = required("CRON_SECRET");
  const appUrl = required("NEXT_PUBLIC_APP_URL");
  const dryRun = parseBoolean(process.env.EMAIL_DRY_RUN, false);
  const dailyCap = parsePositiveInt(process.env.EMAIL_DAILY_CAP, 90);
  const monthlyCap = parsePositiveInt(process.env.EMAIL_MONTHLY_CAP, 2800);

  assertEmailAddressLike(from, "EMAIL_FROM");
  if (replyTo) {
    assertEmailAddressLike(replyTo, "EMAIL_REPLY_TO");
  }

  cached = {
    provider: "resend",
    resendApiKey,
    from,
    replyTo,
    dryRun,
    dailyCap,
    monthlyCap,
    unsubscribeSigningSecret,
    cronSecret,
    appUrl: appUrl.replace(/\/+$/, ""),
  };
  return cached;
}
