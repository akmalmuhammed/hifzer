import type { Metadata } from "next";
import { ChangelogClient } from "./changelog-client";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Track visible Hifzer product changes, shipped milestones, and prototype updates.",
  alternates: {
    canonical: "/changelog",
  },
};

export default function ChangelogPage() {
  return <ChangelogClient />;
}
