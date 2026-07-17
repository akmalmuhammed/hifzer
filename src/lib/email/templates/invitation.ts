import "server-only";

export type InvitationTemplateInput = {
  appUrl: string;
  firstName?: string | null;
  openUrl?: string;
  unsubscribeUrl?: string | null;
};

function cleanName(value: string | null | undefined): string | null {
  const cleaned = value?.replace(/[\r\n\t]+/g, " ").trim().slice(0, 80);
  return cleaned || null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeAppUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function invitationTemplate(input: InvitationTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const appUrl = normalizeAppUrl(input.appUrl);
  const name = cleanName(input.firstName);
  const greeting = name ? `Assalamu alaikum, ${name}` : "Assalamu alaikum";
  const openUrl = input.openUrl ?? `${appUrl}/dashboard`;
  const iconUrl = `${appUrl}/icon.png`;
  const privacyUrl = `${appUrl}/legal/privacy`;
  const unsubscribeUrl = input.unsubscribeUrl ?? `${appUrl}/settings/reminders`;
  const subject = "You were here near the beginning. Hifzer has grown.";
  const preheader =
    "Thank you for giving Hifzer a chance when it was still small. We would love to welcome you back.";
  const fontStack =
    "'Plus Jakarta Sans','Avenir Next','Segoe UI',Arial,sans-serif";

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body, table, td, a, p, h1, h2, h3 { font-family: ${fontStack}; }
    @media only screen and (max-width: 640px) {
      .email-shell { width: 100% !important; }
      .outer-pad { padding: 16px 10px 26px !important; }
      .content-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .hero-title { font-size: 35px !important; line-height: 40px !important; letter-spacing: -1.5px !important; }
      .section-title { font-size: 27px !important; line-height: 33px !important; }
      .feature-icon { width: 42px !important; }
      .feature-copy { padding-left: 14px !important; }
      .desktop-label { display: none !important; }
      .footer-cell { display: block !important; width: 100% !important; text-align: left !important; }
      .footer-links { padding-top: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#edf7f4;background-image:radial-gradient(circle at 8% 14%,rgba(151,231,205,0.42) 0%,rgba(151,231,205,0) 31%),radial-gradient(circle at 92% 10%,rgba(174,220,255,0.48) 0%,rgba(174,220,255,0) 34%),linear-gradient(135deg,#eefaf6 0%,#fbfdfc 48%,#eef6ff 100%);color:#091525;font-family:${fontStack};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${escapeHtml(preheader)}</div>
  <div style="display:none;max-height:0;overflow:hidden;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#edf7f4" style="width:100%;background-color:#edf7f4;background-image:radial-gradient(circle at 8% 14%,rgba(151,231,205,0.42) 0%,rgba(151,231,205,0) 31%),radial-gradient(circle at 92% 10%,rgba(174,220,255,0.48) 0%,rgba(174,220,255,0) 34%),linear-gradient(135deg,#eefaf6 0%,#fbfdfc 48%,#eef6ff 100%);">
    <tr>
      <td class="outer-pad" align="center" style="padding:34px 18px 44px;">
        <table role="presentation" class="email-shell" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;">
          <tr>
            <td style="padding:0 10px 18px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="46" height="46" align="center" valign="middle" bgcolor="#f8fffc" style="width:46px;height:46px;background-color:#f8fffc;border:1px solid #bfe5dc;border-radius:15px;box-shadow:0 8px 22px rgba(20,100,84,0.08);">
                          <img src="${escapeHtml(iconUrl)}" width="27" height="27" alt="Hifzer" style="display:block;width:27px;height:27px;border:0;" />
                        </td>
                        <td style="padding-left:12px;">
                          <div style="font-size:18px;line-height:22px;font-weight:700;color:#091525;letter-spacing:-0.4px;">Hifzer</div>
                          <div style="font-size:11px;line-height:17px;color:#63716f;">Your daily Qur'an companion</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="desktop-label" align="right" valign="middle">
                    <span style="display:inline-block;padding:8px 12px;background-color:#f8fffc;border:1px solid #c9e7df;border-radius:999px;font-size:9px;line-height:12px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#078c79;">Latest update</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td bgcolor="#f8fffc" style="background-color:#f8fffc;background-image:radial-gradient(circle at 10% 12%,rgba(126,222,194,0.38) 0%,rgba(126,222,194,0) 34%),radial-gradient(circle at 92% 18%,rgba(166,215,255,0.44) 0%,rgba(166,215,255,0) 36%),linear-gradient(140deg,#e8f9f3 0%,#ffffff 50%,#edf6ff 100%);border:1px solid #b8e1d8;border-radius:28px;box-shadow:0 24px 70px rgba(28,86,74,0.12);overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="content-pad" style="padding:48px 48px 42px;">
                    <span style="display:inline-block;padding:8px 12px;background-color:rgba(255,255,255,0.72);border:1px solid #b8ded5;border-radius:999px;font-size:9px;line-height:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#078c79;">A note for our early users</span>
                    <h1 class="hero-title" style="margin:22px 0 18px;max-width:520px;font-family:${fontStack};font-size:43px;line-height:48px;font-weight:800;letter-spacing:-2px;color:#071525;">
                      You were here near the beginning. Come see how Hifzer has grown.
                    </h1>
                    <p style="margin:0 0 12px;font-size:16px;line-height:25px;font-weight:600;color:#102522;">${escapeHtml(greeting)}.</p>
                    <p style="margin:0 0 28px;max-width:510px;font-size:15px;line-height:25px;color:#5f6d71;">
                      Thank you for giving Hifzer a chance when it was still small. Since then, we have rebuilt and expanded it with one intention: to make returning to the Qur'an feel easier, steadier, and more personal. We would be honored to welcome you back.
                    </p>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td bgcolor="#079580" style="background-color:#079580;border-radius:14px;box-shadow:0 10px 24px rgba(7,149,128,0.22);">
                          <a href="${escapeHtml(openUrl)}" style="display:inline-block;padding:15px 22px;font-family:${fontStack};font-size:14px;line-height:18px;font-weight:700;color:#ffffff;text-decoration:none;">See the new Hifzer&nbsp;&nbsp;&rarr;</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-size:11px;line-height:17px;color:#71807e;">Everything in this update is free. No card. No subscription.</p>
                  </td>
                </tr>
                <tr>
                  <td class="content-pad" style="padding:0 48px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:rgba(255,255,255,0.62);border:1px solid #cce8e1;border-radius:18px;">
                      <tr>
                        <td align="center" style="padding:15px 8px;font-size:10px;line-height:14px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;color:#126c60;">Read</td>
                        <td align="center" style="color:#9fcac1;">&middot;</td>
                        <td align="center" style="padding:15px 8px;font-size:10px;line-height:14px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;color:#126c60;">Retain</td>
                        <td align="center" style="color:#9fcac1;">&middot;</td>
                        <td align="center" style="padding:15px 8px;font-size:10px;line-height:14px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;color:#126c60;">Make dua</td>
                        <td align="center" style="color:#9fcac1;">&middot;</td>
                        <td align="center" style="padding:15px 8px;font-size:10px;line-height:14px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;color:#126c60;">Reflect</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td height="16" style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <tr>
            <td bgcolor="#fbfefd" style="background-color:#fbfefd;background-image:radial-gradient(circle at 0% 18%,rgba(183,236,219,0.22) 0%,rgba(183,236,219,0) 30%),radial-gradient(circle at 100% 76%,rgba(194,222,255,0.22) 0%,rgba(194,222,255,0) 32%),linear-gradient(145deg,#ffffff 0%,#f4fbf8 100%);border:1px solid #c8e4dd;border-radius:28px;box-shadow:0 18px 52px rgba(34,76,68,0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="content-pad" style="padding:40px 48px 22px;">
                    <p style="margin:0 0 10px;font-size:9px;line-height:13px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase;color:#078c79;">Built around your daily practice</p>
                    <h2 class="section-title" style="margin:0;max-width:490px;font-family:${fontStack};font-size:31px;line-height:37px;font-weight:800;letter-spacing:-1.2px;color:#091525;">The parts of your Qur'an life, finally in one place.</h2>
                  </td>
                </tr>

                <tr>
                  <td class="content-pad" style="padding:8px 48px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td class="feature-icon" width="58" valign="top" style="width:58px;padding:25px 0;border-top:1px solid #dcebe7;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="42" height="42" align="center" bgcolor="#e5f7f2" style="width:42px;height:42px;background-color:#e5f7f2;border:1px solid #bae5db;border-radius:14px;font-size:12px;line-height:42px;font-weight:800;color:#078c79;">01</td></tr></table>
                        </td>
                        <td class="feature-copy" valign="top" style="padding:25px 0 25px 12px;border-top:1px solid #dcebe7;">
                          <div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#078c79;">Qur'an</div>
                          <h3 style="margin:5px 0 7px;font-family:${fontStack};font-size:20px;line-height:26px;font-weight:700;letter-spacing:-0.5px;color:#0b1727;">Return to the exact ayah.</h3>
                          <p style="margin:0;font-size:14px;line-height:23px;color:#637074;">Resume where you stopped, then keep trusted translation, tafsir, recitation, and bookmarks close as you read.</p>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature-icon" width="58" valign="top" style="width:58px;padding:25px 0;border-top:1px solid #dcebe7;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="42" height="42" align="center" bgcolor="#e5f7f2" style="width:42px;height:42px;background-color:#e5f7f2;border:1px solid #bae5db;border-radius:14px;font-size:12px;line-height:42px;font-weight:800;color:#078c79;">02</td></tr></table>
                        </td>
                        <td class="feature-copy" valign="top" style="padding:25px 0 25px 12px;border-top:1px solid #dcebe7;">
                          <div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#078c79;">Hifz</div>
                          <h3 style="margin:5px 0 7px;font-family:${fontStack};font-size:20px;line-height:26px;font-weight:700;letter-spacing:-0.5px;color:#0b1727;">Keep what you memorized.</h3>
                          <p style="margin:0;font-size:14px;line-height:23px;color:#637074;">See today's sabaq, sabqi, and manzil, then revisit weak ayahs and transitions before they quietly fade.</p>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature-icon" width="58" valign="top" style="width:58px;padding:25px 0;border-top:1px solid #dcebe7;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="42" height="42" align="center" bgcolor="#e5f7f2" style="width:42px;height:42px;background-color:#e5f7f2;border:1px solid #bae5db;border-radius:14px;font-size:12px;line-height:42px;font-weight:800;color:#078c79;">03</td></tr></table>
                        </td>
                        <td class="feature-copy" valign="top" style="padding:25px 0 25px 12px;border-top:1px solid #dcebe7;">
                          <div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#078c79;">Dua</div>
                          <h3 style="margin:5px 0 7px;font-family:${fontStack};font-size:20px;line-height:26px;font-weight:700;letter-spacing:-0.5px;color:#0b1727;">Guidance that feels personal.</h3>
                          <p style="margin:0;font-size:14px;line-height:23px;color:#637074;">Move through sourced dua journeys for hardship, repentance, gratitude, provision, and protection, with room for your own duas.</p>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature-icon" width="58" valign="top" style="width:58px;padding:25px 0;border-top:1px solid #dcebe7;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="42" height="42" align="center" bgcolor="#e5f7f2" style="width:42px;height:42px;background-color:#e5f7f2;border:1px solid #bae5db;border-radius:14px;font-size:12px;line-height:42px;font-weight:800;color:#078c79;">04</td></tr></table>
                        </td>
                        <td class="feature-copy" valign="top" style="padding:25px 0 25px 12px;border-top:1px solid #dcebe7;">
                          <div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#078c79;">Private journal</div>
                          <h3 style="margin:5px 0 7px;font-family:${fontStack};font-size:20px;line-height:26px;font-weight:700;letter-spacing:-0.5px;color:#0b1727;">Let the moment stay with you.</h3>
                          <p style="margin:0;font-size:14px;line-height:23px;color:#637074;">Keep the ayah or dua that moved you beside a private reflection stored only under your account.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="content-pad" style="padding:10px 48px 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#eaf7f4" style="background-color:#eaf7f4;background-image:radial-gradient(circle at 8% 10%,rgba(120,219,191,0.28) 0%,rgba(120,219,191,0) 38%),radial-gradient(circle at 92% 90%,rgba(171,214,255,0.32) 0%,rgba(171,214,255,0) 40%),linear-gradient(135deg,#e3f6f0 0%,#f7fbff 100%);border:1px solid #bfe1d9;border-radius:20px;">
                      <tr>
                        <td style="padding:27px 27px 25px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td valign="middle"><span style="display:inline-block;padding:7px 10px;background-color:#d8efe9;border:1px solid #acd9cf;border-radius:999px;font-size:9px;line-height:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#087b6b;">Hifzer AI</span></td>
                              <td align="right" valign="middle" style="font-size:9px;line-height:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6f8580;">Grounded Qur'an guidance</td>
                            </tr>
                          </table>
                          <h3 style="margin:16px 0 9px;font-family:${fontStack};font-size:25px;line-height:31px;font-weight:800;letter-spacing:-0.8px;color:#0a2823;">Ask with the sources in view.</h3>
                          <p style="margin:0;font-size:14px;line-height:23px;color:#536c67;">Ask about an ayah or Qur'an topic. Hifzer places matched ayahs, translation, tafsir context, and clear source labels beside the answer so you can inspect what it is grounded in.</p>
                          <p style="margin:16px 0 0;font-size:10px;line-height:18px;font-weight:700;letter-spacing:0.2px;color:#176c60;">Matched ayahs&nbsp;&nbsp;&middot;&nbsp;&nbsp;Tafsir context&nbsp;&nbsp;&middot;&nbsp;&nbsp;Visible sources</p>
                          <p style="margin:13px 0 0;font-size:10px;line-height:17px;color:#7b8c88;">Built for study and reflection. It does not replace a qualified teacher or scholar.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="content-pad" style="padding:28px 48px 4px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #dcebe7;border-bottom:1px solid #dcebe7;">
                      <tr>
                        <td style="padding:22px 0;">
                          <div style="font-size:9px;line-height:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#078c79;">Open to everyone</div>
                          <h3 style="margin:5px 0 5px;font-family:${fontStack};font-size:19px;line-height:25px;font-weight:700;color:#0b1727;">Every feature in this update is free to use.</h3>
                          <p style="margin:0;font-size:13px;line-height:21px;color:#68777a;">No card, no subscription, and no pressure to do everything at once.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" class="content-pad" style="padding:36px 48px 42px;">
                    <h2 style="margin:0 0 10px;font-family:${fontStack};font-size:27px;line-height:33px;font-weight:800;letter-spacing:-1px;color:#091525;">It would mean a lot to welcome you back.</h2>
                    <p style="margin:0 0 20px;max-width:430px;font-size:14px;line-height:23px;color:#68777a;">Come see what Hifzer has become, then let one meaningful step be enough for today.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td bgcolor="#079580" style="background-color:#079580;border-radius:14px;box-shadow:0 10px 24px rgba(7,149,128,0.20);">
                          <a href="${escapeHtml(openUrl)}" style="display:inline-block;padding:15px 23px;font-family:${fontStack};font-size:14px;line-height:18px;font-weight:700;color:#ffffff;text-decoration:none;">Come back to Hifzer&nbsp;&nbsp;&rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="content-pad" style="padding:26px 28px 4px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-cell" valign="top">
                    <p style="margin:0 0 3px;font-size:13px;line-height:19px;font-weight:700;color:#243734;">Akmal</p>
                    <p style="margin:0;font-size:11px;line-height:18px;color:#748480;">Founder, Hifzer</p>
                  </td>
                  <td class="footer-cell footer-links" align="right" valign="top" style="font-size:10px;line-height:17px;color:#748480;">
                    <a href="${escapeHtml(privacyUrl)}" style="color:#536c67;text-decoration:underline;">Privacy</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="${escapeHtml(unsubscribeUrl)}" style="color:#536c67;text-decoration:underline;">Unsubscribe</a><br />
                    &copy; ${new Date().getFullYear()} Hifzer
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;text-align:center;font-size:10px;line-height:17px;color:#83928f;">You received this update because you have a Hifzer account.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    subject,
    "",
    `${greeting}.`,
    "",
    "Thank you for giving Hifzer a chance when it was still small. Since then, we have rebuilt and expanded it with one intention: to make returning to the Qur'an feel easier, steadier, and more personal. We would be honored to welcome you back.",
    "",
    "QUR'AN",
    "Return to the exact ayah. Resume where you stopped, choose trusted translation, tafsir, and recitation, then bookmark what you want to keep close.",
    "",
    "HIFZ",
    "Keep what you memorized. See today's sabaq, sabqi, and manzil, then repair weak ayahs and transitions before they quietly fade.",
    "",
    "DUA",
    "Guidance that feels personal. Move through sourced journeys for hardship, repentance, gratitude, provision, and protection, with space for your own duas.",
    "",
    "PRIVATE JOURNAL",
    "Keep the ayah or dua that moved you beside a private reflection stored only under your account.",
    "",
    "HIFZER AI",
    "Ask about an ayah or Qur'an topic. Hifzer brings matched ayahs, translation, tafsir context, and source labels beside the answer so you can inspect what it is grounded in.",
    "Built for study and reflection. It does not replace a qualified teacher or scholar.",
    "",
    "Every feature in this update is free to use. No card. No subscription.",
    "",
    `Continue in Hifzer: ${openUrl}`,
    "",
    "It would mean a lot to welcome you back.",
    "",
    "Akmal",
    "Founder, Hifzer",
    "",
    `Privacy: ${privacyUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
