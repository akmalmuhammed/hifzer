import { describe, expect, it } from "vitest";
import { invitationTemplate } from "@/lib/email/templates/invitation";

describe("invitationTemplate", () => {
  it("renders the latest product story in HTML and plain text", () => {
    const rendered = invitationTemplate({
      appUrl: "https://www.hifzer.com/",
      firstName: "Akmal",
      unsubscribeUrl: "mailto:support@hifzer.com?subject=Unsubscribe",
    });

    expect(rendered.subject).toContain("You were here near the beginning");
    expect(rendered.html).toContain("Assalamu alaikum, Akmal");
    expect(rendered.html).toContain("We would be honored to welcome you back");
    expect(rendered.html).toContain("Return to the exact ayah");
    expect(rendered.html).toContain("Keep what you memorized");
    expect(rendered.html).toContain("Guidance that feels personal");
    expect(rendered.html).toContain("Private journal");
    expect(rendered.html).toContain("Hifzer AI");
    expect(rendered.html).toContain("Every feature in this update is free to use");
    expect(rendered.html).toContain("https://www.hifzer.com/dashboard");
    expect(rendered.text).toContain("No card. No subscription.");
    expect(rendered.text).toContain("mailto:support@hifzer.com?subject=Unsubscribe");
  });

  it("escapes personalized content before placing it in HTML", () => {
    const rendered = invitationTemplate({
      appUrl: "https://www.hifzer.com",
      firstName: "<Akmal & team>",
    });

    expect(rendered.html).toContain("Assalamu alaikum, &lt;Akmal &amp; team&gt;");
    expect(rendered.html).not.toContain("Assalamu alaikum, <Akmal & team>");
  });
});
