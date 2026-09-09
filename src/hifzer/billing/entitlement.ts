export type PremiumTransaction = {
  transactionId: string;
  clerkUserId: string | null;
};

export type DurableEntitlementStatus = "ACTIVE" | "REVOKED";

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function classifyPremiumTransaction(input: {
  id?: unknown;
  customData?: unknown;
}): PremiumTransaction | null {
  const transactionId = typeof input.id === "string" ? input.id.trim() : "";
  if (!transactionId || !input.customData || typeof input.customData !== "object") return null;
  const customData = input.customData as Record<string, unknown>;
  const purchaseKind = readString(customData, "purchase_kind");
  const isPremium = purchaseKind === "premium_lifetime" || readString(customData, "support_amount") !== null;
  if (!isPremium) return null;
  return {
    transactionId,
    clerkUserId: readString(customData, "clerk_user_id"),
  };
}

export function entitlementStatusForAdjustment(input: {
  action?: unknown;
  status?: unknown;
  type?: unknown;
}): DurableEntitlementStatus | null {
  const fullRevocation = input.status === "approved" && input.type === "full" &&
    (input.action === "refund" || input.action === "chargeback");
  if (fullRevocation) return "REVOKED";

  const reversal = input.status === "reversed" ||
    (input.status === "approved" &&
      (input.action === "credit_reverse" || input.action === "chargeback_reverse"));
  return reversal ? "ACTIVE" : null;
}
