import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const apiKey = process.env.RESEND_API_KEY?.trim();
if (!apiKey) {
  throw new Error("RESEND_API_KEY is required.");
}

const from = process.env.EMAIL_FROM?.trim();
if (!from || !from.includes("@")) {
  throw new Error("EMAIL_FROM must contain the verified sender address.");
}

const resend = new Resend(apiKey);
const domains = await resend.domains.list();

if (domains.error) {
  throw new Error(`${domains.error.name}: ${domains.error.message}`);
}

const senderDomain = from.match(/@([^>\s]+)>?$/)?.[1]?.toLowerCase();
const matchingDomain = domains.data?.data?.find(
  (domain) => domain.name.toLowerCase() === senderDomain,
);

console.log(JSON.stringify({
  provider: "resend",
  apiKey: "configured",
  from,
  senderDomain,
  senderDomainStatus: matchingDomain?.status ?? "not_found",
  domains: domains.data?.data?.map((domain) => ({ name: domain.name, status: domain.status })) ?? [],
  canSend: matchingDomain?.status === "verified",
}, null, 2));

if (matchingDomain?.status !== "verified") {
  process.exitCode = 1;
}
