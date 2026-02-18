import "server-only";

export type InvitationTemplateInput = {
  appUrl: string;
  firstName?: string | null;
  signUpUrl?: string;
};

export function invitationTemplate(input: InvitationTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = input.firstName?.trim() || null;
  const greeting = name ? `Assalamu alaikum, ${name}` : "Assalamu alaikum";
  const signUpUrl = input.signUpUrl ?? "https://www.hifzer.com/";
  const iconUrl = "https://www.hifzer.com/_next/image?url=%2Ficon.png&w=64&q=75";
  const subject = "You're invited to Hifzer — your Hifz deserves a system";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo mark -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0a8a77;border-radius:16px;width:52px;height:52px;text-align:center;vertical-align:middle;box-shadow:0 8px 20px -4px rgba(10,138,119,0.35);">
                    <img src="${iconUrl}" width="32" height="32" alt="Hifzer" style="display:block;margin:10px auto;border-radius:4px;" />
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.4px;">Hifzer</span><br/>
                    <span style="font-size:11px;color:#6b7280;letter-spacing:0.5px;text-transform:uppercase;font-weight:600;">Hifz Operating System</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:24px;border:1px solid #d1fae5;overflow:hidden;box-shadow:0 4px 28px rgba(10,138,119,0.10);">

              <!-- Accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#0a8a77 0%,#2b4bff 52%,#ea580c 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 40px 32px;">

                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#0a8a77;">Personal Invitation</p>
                    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.25;letter-spacing:-0.5px;">
                      ${greeting},<br/>
                      your Hifz deserves a system<br/>that never lets it fade.
                    </h1>

                    <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#374151;">
                      Every ayah you carry is a trust. But without a structured review system, even the strongest memorization quietly erodes — and you often don't notice until it's already gone.
                    </p>

                    <p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#374151;border-left:3px solid #0a8a77;padding-left:16px;font-style:italic;color:#0f172a;">
                      "The one who memorizes the Qur'an and then forgets it will meet Allah on the Day of Resurrection in a wretched state." — Abu Dawud
                    </p>

                    <!-- What is Hifzer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#f0fdf9;border-radius:16px;border:1px solid #d1fae5;padding:20px 24px;">
                          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#0a8a77;">What is Hifzer?</p>
                          <p style="margin:0 0 12px;font-size:14px;line-height:1.75;color:#374151;">
                            Hifzer is your daily Hifz operating system. It builds a structured review plan around your memorization — automatically scheduling your Sabaq (new), Sabqi (recent), and Manzil (long-term) reviews every single day.
                          </p>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:3px 0;">
                                <span style="display:inline-block;background:#0a8a77;border-radius:50%;width:6px;height:6px;vertical-align:middle;margin-right:8px;"></span>
                                <span style="font-size:13px;color:#374151;font-weight:600;">Quality gates</span>
                                <span style="font-size:13px;color:#6b7280;"> — blocks new ayahs until yesterday's pass</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:3px 0;">
                                <span style="display:inline-block;background:#2b4bff;border-radius:50%;width:6px;height:6px;vertical-align:middle;margin-right:8px;"></span>
                                <span style="font-size:13px;color:#374151;font-weight:600;">Spaced repetition</span>
                                <span style="font-size:13px;color:#6b7280;"> — per-ayah grading (Again / Hard / Good / Easy)</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:3px 0;">
                                <span style="display:inline-block;background:#ea580c;border-radius:50%;width:6px;height:6px;vertical-align:middle;margin-right:8px;"></span>
                                <span style="font-size:13px;color:#374151;font-weight:600;">Adapts automatically</span>
                                <span style="font-size:13px;color:#6b7280;"> — protects retention even when life gets in the way</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#374151;">
                      You've been personally invited. Access is <strong style="color:#0f172a;">completely free</strong> — no card required.
                    </p>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td align="center">
                          <a href="${signUpUrl}" style="display:inline-block;padding:15px 40px;background:#0a8a77;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:-0.2px;box-shadow:0 4px 14px rgba(10,138,119,0.30);">
                            Accept your invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Free forever for core features. No credit card required.</p>

                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 40px 32px;border-top:1px solid #f0fdf9;">
                    <p style="margin:24px 0 2px;font-size:14px;font-weight:700;color:#0f172a;">Akmal</p>
                    <p style="margin:0;font-size:13px;color:#9ca3af;">Founder, Hifzer</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;">
                You received this because you were personally invited to Hifzer.<br />
                &copy; ${new Date().getFullYear()} Hifzer &nbsp;·&nbsp; <a href="https://www.hifzer.com/legal/privacy" style="color:#9ca3af;">Privacy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `${greeting},`,
    "",
    "Your Hifz deserves a system that never lets it fade.",
    "",
    "Every ayah you carry is a trust. But without structured review, even strong memorization quietly erodes — and you often don't notice until it's already gone.",
    "",
    "What is Hifzer?",
    "Hifzer is your daily Hifz operating system. It builds a structured review plan around your memorization — automatically scheduling your Sabaq (new), Sabqi (recent), and Manzil (long-term) reviews every single day.",
    "",
    "· Quality gates — blocks new ayahs until yesterday's pass",
    "· Spaced repetition — per-ayah grading (Again / Hard / Good / Easy)",
    "· Adapts automatically — protects retention even when life gets in the way",
    "",
    "You've been personally invited. Access is completely free — no card required.",
    "",
    `Accept your invitation: ${signUpUrl}`,
    "",
    "— Akmal",
    "Founder, Hifzer",
  ].join("\n");

  return { subject, html, text };
}
