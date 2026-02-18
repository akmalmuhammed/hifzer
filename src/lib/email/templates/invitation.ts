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
  const signUpUrl = input.signUpUrl ?? `${input.appUrl}/signup`;
  const subject = "You're invited to Hifzer — protect your Hifz this Ramadan";

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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0a8a77;border-radius:14px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                    <img src="${input.appUrl}/icon.png" width="28" height="28" alt="Hifzer" style="display:block;margin:8px auto;" />
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;">Hifzer</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:24px;border:1px solid #d1fae5;overflow:hidden;box-shadow:0 4px 24px rgba(10,138,119,0.08);">

              <!-- Accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#0a8a77 0%,#2b4bff 52%,#ea580c 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 40px 32px;">

                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#0a8a77;">Personal invitation</p>
                    <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;letter-spacing:-0.4px;">${greeting},<br/>your Hifz deserves a system that never forgets.</p>

                    <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#374151;">
                      Every ayah you've memorized is precious. Hifzer makes sure none of it fades. It runs your daily reviews automatically, protects what you've built, and keeps you on track even when life gets in the way.
                    </p>

                    <p style="margin:0 0 28px;font-size:15px;line-height:1.75;color:#374151;">
                      With Ramadan approaching, there is no better time to start. Your invitation is ready and <strong style="color:#0f172a;">access is completely free.</strong>
                    </p>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="${signUpUrl}" style="display:inline-block;padding:14px 36px;background:#0a8a77;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:-0.2px;">
                            Claim your invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Free forever for core features. No card required.</p>

                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 40px 28px;border-top:1px solid #f0fdf9;">
                    <p style="margin:20px 0 2px;font-size:14px;font-weight:600;color:#0f172a;">Akmal</p>
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
                You received this because you were personally invited.<br />
                &copy; ${new Date().getFullYear()} Hifzer
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
    "I'm Akmal — I built Hifzer after losing eight juz following university.",
    "",
    "Hifzer is the operating system for Qur'an memorization: quality gates, spaced repetition (Sabaq / Sabqi / Manzil tiers), and review debt protection — all in one daily session.",
    "",
    "With Ramadan approaching, I'm inviting you personally. Access is free.",
    "",
    `Accept your invitation: ${signUpUrl}`,
    "",
    "— Akmal",
    "Founder, Hifzer",
    "akmal@hifzer.com",
  ].join("\n");

  return { subject, html, text };
}
