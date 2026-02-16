import type { SignalType, TeamHealth } from "@/demo/types";
import { Pill } from "@/components/ui/pill";

export function HealthPill(props: { health: TeamHealth }) {
  const h = props.health;
  if (h === "GREEN") {
    return <Pill tone="success">Green</Pill>;
  }
  if (h === "RED") {
    return <Pill tone="danger">Red</Pill>;
  }
  return <Pill tone="warn">Amber</Pill>;
}

export function SignalPill(props: { type: SignalType }) {
  const t = props.type;
  if (t === "Win") {
    return <Pill tone="success">Win</Pill>;
  }
  if (t === "Blocker") {
    return <Pill tone="danger">Blocker</Pill>;
  }
  return <Pill tone="warn">Risk</Pill>;
}

