import { describe, expect, it } from "vitest";
import { classifyPremiumTransaction, entitlementStatusForAdjustment } from "./entitlement";

describe("premium Paddle transactions", () => {
  it("recognizes the versioned lifetime purchase marker", () => {
    expect(classifyPremiumTransaction({
      id: "txn_123",
      customData: { purchase_kind: "premium_lifetime", clerk_user_id: "user_123" },
    })).toEqual({ transactionId: "txn_123", clerkUserId: "user_123" });
  });

  it("keeps legacy support purchases eligible", () => {
    expect(classifyPremiumTransaction({ id: "txn_old", customData: { support_amount: "99.00" } }))
      .toEqual({ transactionId: "txn_old", clerkUserId: null });
  });

  it("ignores unrelated or unidentifiable transactions", () => {
    expect(classifyPremiumTransaction({ id: "txn_other", customData: { purchase_kind: "tip" } })).toBeNull();
    expect(classifyPremiumTransaction({ customData: { purchase_kind: "premium_lifetime" } })).toBeNull();
  });

  it("revokes only full approved refunds or chargebacks and restores reversals", () => {
    expect(entitlementStatusForAdjustment({ action: "refund", status: "approved", type: "full" }))
      .toBe("REVOKED");
    expect(entitlementStatusForAdjustment({ action: "chargeback", status: "approved", type: "full" }))
      .toBe("REVOKED");
    expect(entitlementStatusForAdjustment({ action: "refund", status: "approved", type: "partial" }))
      .toBeNull();
    expect(entitlementStatusForAdjustment({ action: "refund", status: "reversed", type: "full" }))
      .toBe("ACTIVE");
  });
});
