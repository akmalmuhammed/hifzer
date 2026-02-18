import { describe, expect, it } from "vitest";
import {
  evaluateReminderEligibility,
  isWithinReminderWindow,
  parseReminderTimeToMinutes,
  type SchedulerCandidate,
} from "@/lib/email/reminder-scheduler.server";

const BASE_CANDIDATE: SchedulerCandidate = {
  id: "u_1",
  clerkUserId: "user_1",
  timezone: "UTC",
  reminderTimeLocal: "06:00",
  practiceDays: [0, 1, 2, 3, 4, 5, 6],
  onboardingCompletedAt: new Date("2026-02-01T00:00:00.000Z"),
  emailRemindersEnabled: true,
  emailSuppressedAt: null,
  emailUnsubscribedAt: null,
};

describe("email/reminder-scheduler", () => {
  it("parses reminder time to minutes", () => {
    expect(parseReminderTimeToMinutes("00:00")).toBe(0);
    expect(parseReminderTimeToMinutes("06:30")).toBe(390);
    expect(parseReminderTimeToMinutes("23:59")).toBe(1439);
    expect(parseReminderTimeToMinutes("24:00")).toBeNull();
  });

  it("applies reminder window checks including midnight wrap", () => {
    expect(isWithinReminderWindow({ nowMinuteOfDay: 360, reminderMinuteOfDay: 360, windowMinutes: 35 })).toBe(true);
    expect(isWithinReminderWindow({ nowMinuteOfDay: 390, reminderMinuteOfDay: 360, windowMinutes: 35 })).toBe(true);
    expect(isWithinReminderWindow({ nowMinuteOfDay: 420, reminderMinuteOfDay: 360, windowMinutes: 35 })).toBe(false);
    expect(isWithinReminderWindow({ nowMinuteOfDay: 1438, reminderMinuteOfDay: 5, windowMinutes: 10 })).toBe(true);
  });

  it("marks eligible when all requirements pass", () => {
    const out = evaluateReminderEligibility({
      candidate: BASE_CANDIDATE,
      now: new Date("2026-02-18T06:10:00.000Z"),
    });
    expect(out.eligible).toBe(true);
    expect(out.reason).toBe("ok");
    expect(out.localDate).toBe("2026-02-18");
  });

  it("rejects when reminder is disabled, suppressed, or unsubscribed", () => {
    expect(evaluateReminderEligibility({
      candidate: { ...BASE_CANDIDATE, emailRemindersEnabled: false },
      now: new Date("2026-02-18T06:10:00.000Z"),
    }).reason).toBe("disabled");

    expect(evaluateReminderEligibility({
      candidate: { ...BASE_CANDIDATE, emailSuppressedAt: new Date("2026-02-17T00:00:00.000Z") },
      now: new Date("2026-02-18T06:10:00.000Z"),
    }).reason).toBe("suppressed");

    expect(evaluateReminderEligibility({
      candidate: { ...BASE_CANDIDATE, emailUnsubscribedAt: new Date("2026-02-17T00:00:00.000Z") },
      now: new Date("2026-02-18T06:10:00.000Z"),
    }).reason).toBe("unsubscribed");
  });

  it("rejects off-practice-day and outside window", () => {
    const offDay = evaluateReminderEligibility({
      candidate: { ...BASE_CANDIDATE, practiceDays: [0, 6] },
      now: new Date("2026-02-18T06:10:00.000Z"),
    });
    expect(offDay.eligible).toBe(false);
    expect(offDay.reason).toBe("off_day");

    const outsideWindow = evaluateReminderEligibility({
      candidate: BASE_CANDIDATE,
      now: new Date("2026-02-18T08:00:00.000Z"),
    });
    expect(outsideWindow.eligible).toBe(false);
    expect(outsideWindow.reason).toBe("outside_window");
  });
});
