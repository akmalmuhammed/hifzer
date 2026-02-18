export type EmailTemplateKey = "daily_practice_reminder";

export type EmailSendRequest = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type EmailSendResult =
  | {
    ok: true;
    provider: "resend";
    messageId: string | null;
  }
  | {
    ok: false;
    provider: "resend";
    errorCode: string | null;
    errorMessage: string;
  };

export interface EmailProvider {
  send(input: EmailSendRequest): Promise<EmailSendResult>;
}
