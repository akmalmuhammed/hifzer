import "server-only";

import { Resend } from "resend";
import { emailConfig } from "@/lib/email/config.server";
import type { EmailProvider, EmailSendRequest, EmailSendResult } from "@/lib/email/types";

let client: Resend | null = null;

function resendClient(): Resend {
  if (client) {
    return client;
  }
  const cfg = emailConfig();
  client = new Resend(cfg.resendApiKey);
  return client;
}

export class ResendProvider implements EmailProvider {
  async send(input: EmailSendRequest): Promise<EmailSendResult> {
    const cfg = emailConfig();
    const response = await resendClient().emails.send(
      {
        from: cfg.from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: cfg.replyTo ?? undefined,
      },
      {
        idempotencyKey: input.idempotencyKey,
      },
    );

    if (response.error) {
      return {
        ok: false,
        provider: "resend",
        errorCode: response.error.name ?? null,
        errorMessage: response.error.message || "Resend send failed.",
      };
    }

    return {
      ok: true,
      provider: "resend",
      messageId: response.data?.id ?? null,
    };
  }
}
