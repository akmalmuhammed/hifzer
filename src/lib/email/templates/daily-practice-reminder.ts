import "server-only";

export type DailyPracticeReminderTemplateInput = {
  appUrl: string;
  unsubscribeUrl: string;
  firstName: string | null;
  reminderTimeLocal: string;
  timezone: string;
};

export function dailyPracticeReminderTemplate(input: DailyPracticeReminderTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = input.firstName?.trim() || "there";
  const dashboardUrl = `${input.appUrl}/dashboard`;
  const subject = "Hifzer reminder: protect today's retention";
  const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111827;">
  <p>Assalamu alaikum ${name},</p>
  <p>Your daily Hifzer reminder is due. A short review now protects what you already memorized.</p>
  <p>
    <a href="${dashboardUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0a8a77;color:#ffffff;text-decoration:none;font-weight:600;">
      Open your dashboard
    </a>
  </p>
  <p style="font-size:13px;color:#6b7280;">
    Schedule: ${input.reminderTimeLocal} (${input.timezone}).
  </p>
  <p style="font-size:12px;color:#6b7280;">
    Don't want reminder emails? <a href="${input.unsubscribeUrl}">Unsubscribe</a>
  </p>
</div>`.trim();
  const text = [
    `Assalamu alaikum ${name},`,
    "",
    "Your daily Hifzer reminder is due. A short review now protects what you already memorized.",
    "",
    `Open your dashboard: ${dashboardUrl}`,
    "",
    `Schedule: ${input.reminderTimeLocal} (${input.timezone})`,
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ].join("\n");
  return { subject, html, text };
}
