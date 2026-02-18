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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0a8a77;border-radius:14px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;line-height:40px;">H</span>
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

              <!-- Accent top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(90deg,#0a8a77 0%,#2b4bff 52%,#ea580c 100%);height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Arabic verse area -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:32px 40px 0 40px;background:linear-gradient(180deg,rgba(10,138,119,0.06) 0%,transparent 100%);">
                    <p style="margin:0;font-size:26px;color:#0a8a77;letter-spacing:2px;font-family:serif;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#6b7280;letter-spacing:0.3px;">In the name of Allah, the Most Gracious, the Most Merciful</p>
                  </td>
                </tr>
              </table>

              <!-- Body content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px;">

                    <p style="margin:0 0 20px;font-size:16px;color:#0f172a;font-weight:600;">${greeting},</p>

                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">
                      I'm Akmal — I built Hifzer after losing eight juz following university. I spent years
                      without a proper system, reviewing randomly, never sure what was actually sticking.
                    </p>

                    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">
                      Hifzer is the operating system I wish I'd had. It runs your daily reviews in a fixed,
                      intelligent order — warm-up, recent reviews, long-term rotation, and new material —
                      and it adapts when life gets in the way.
                    </p>

                    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#374151;">
                      With Ramadan approaching, there's no better time to build a system that actually holds.
                      I'm inviting you personally — <strong style="color:#0f172a;">access is free.</strong>
                    </p>

                    <!-- Feature pills -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="padding:0 0 10px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#f0fdf9;border:1px solid #d1fae5;border-radius:12px;padding:12px 16px;vertical-align:top;">
                                <p style="margin:0;font-size:13px;font-weight:700;color:#0a8a77;">Quality gates</p>
                                <p style="margin:4px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Blocks false progress. You don't advance until you truly know an ayah.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 0 10px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#f0fdf9;border:1px solid #d1fae5;border-radius:12px;padding:12px 16px;vertical-align:top;">
                                <p style="margin:0;font-size:13px;font-weight:700;color:#0a8a77;">Sabaq · Sabqi · Manzil</p>
                                <p style="margin:4px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">The same tiers your teacher uses — now tracked automatically every session.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="background:#f0fdf9;border:1px solid #d1fae5;border-radius:12px;padding:12px 16px;vertical-align:top;">
                                <p style="margin:0;font-size:13px;font-weight:700;color:#0a8a77;">Review debt protection</p>
                                <p style="margin:4px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">Misses don't disappear — they're tracked, then cleared systematically.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${signUpUrl}"
                             style="display:inline-block;padding:14px 32px;background:#0a8a77;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:-0.2px;">
                            Accept your invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">
                      Free forever for core features. No card required.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 40px 32px;border-top:1px solid #f0fdf9;">
                    <p style="margin:24px 0 4px;font-size:14px;color:#0f172a;font-weight:600;">Akmal</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;">Founder, Hifzer · <a href="mailto:akmal@hifzer.com" style="color:#0a8a77;text-decoration:none;">akmal@hifzer.com</a></p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
                You received this because you were personally invited.<br />
                © ${new Date().getFullYear()} Hifzer. hifzer.com
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
