import "server-only";

export type WelcomeTemplateInput = {
  appUrl: string;
  firstName?: string | null;
  loginUrl?: string;
};

export function welcomeTemplate(input: WelcomeTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = input.firstName?.trim() || null;
  const greeting = name ? `Assalamu alaikum, ${name}` : "Assalamu alaikum";
  const loginUrl = input.loginUrl ?? `${input.appUrl}/login`; // Or straight to dashboard
  const subject = "Welcome to the Hifz Operating System";

  // Using the requested app icon
  const iconUrl = `${input.appUrl}/hifzer%20app%201.png`;

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
                  <td style="background:#0a8a77;border-radius:14px;width:56px;height:56px;text-align:center;vertical-align:middle;box-shadow:0 10px 20px -5px rgba(10,138,119,0.3);">
                    <!-- Using the attached app icon (Open Book) -->
                    <img src="${iconUrl}" width="36" height="36" alt="Hifzer" style="display:block;margin:10px auto;border-radius:4px;" />
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
                  <td style="padding:40px 40px 32px;">

                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#0a8a77;">Welcome to the System</p>
                    <h1 style="margin:0 0 24px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.25;letter-spacing:-0.4px;">
                      ${greeting}.<br/>
                      You have accepted a noble responsibility.
                    </h1>

                    <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">
                      The Qur'an is not merely ink on paper. It is the uncreated speech of Allah, a rope extending from the heavens to your heart. Memorizing it is a lifelong covenant—a promise to carry the Light in a world that often forgets.
                    </p>

                    <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">
                      But memory is fragile. Without a system, verses fade, connections break, and the heart grieves for what it has lost.
                    </p>

                    <p style="margin:0 0 28px;font-size:16px;line-height:1.75;color:#334155;border-left:3px solid #0a8a77;padding-left:16px;font-style:italic;">
                      "This is where Hifzer steps in. You are no longer fighting the erosion of time alone."
                    </p>

                    <p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#334155;">
                      <strong>Hifzer is your operating system for retention.</strong> It is built to optimize every minute of your effort. It enforces your Sabaq integrity, schedules your Manzil automatically, and protects your hard-earned progress from slipping away.
                    </p>

                    <p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:#334155;">
                      We built this tool to serve the guardians of the Book. May Allah make it a means for you to meet Him with His words illuminated in your chest.
                    </p>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td align="center">
                          <a href="${input.appUrl}" style="display:inline-block;padding:16px 40px;background:#0a8a77;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:14px;letter-spacing:-0.2px;box-shadow:0 4px 12px rgba(10,138,119,0.25);">
                            Enter Hifzer
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 40px 28px;border-top:1px solid #f0fdf9;">
                    <p style="margin:24px 0 2px;font-size:14px;font-weight:600;color:#0f172a;">Akmal</p>
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
                Sent with care from the Hifzer team.<br />
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
    "You have accepted a noble responsibility.",
    "",
    "The Qur'an is not merely ink on paper. It is the uncreated speech of Allah, a rope extending from the heavens to your heart. Memorizing it is a lifelong covenant—a promise to carry the Light in a world that often forgets.",
    "",
    "But memory is fragile. Without a system, verses fade, connections break, and the heart grieves for what it has lost.",
    "",
    "This is where Hifzer steps in. You are no longer fighting the erosion of time alone.",
    "",
    "Hifzer is your operating system for retention. It is built to optimize every minute of your effort. It enforces your Sabaq integrity, schedules your Manzil automatically, and protects your hard-earned progress from slipping away.",
    "",
    "We built this tool to serve the guardians of the Book. May Allah make it a means for you to meet Him with His words illuminated in your chest.",
    "",
    `Enter Hifzer: ${input.appUrl}`,
    "",
    "— Akmal",
    "Founder, Hifzer",
  ].join("\n");

  return { subject, html, text };
}
