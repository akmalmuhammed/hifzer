export type ID = string;
export type ISODate = string; // ISO date-time string

export type TeamHealth = "GREEN" | "AMBER" | "RED";
export type TeamRole = "Admin" | "Lead" | "Member";
export type SignalType = "Risk" | "Blocker" | "Win";

export type Team = {
  id: ID;
  name: string;
  handle: string;
  tagline: string;
  brand: {
    primary: string; // CSS color value
    accent: string; // CSS color value
  };
  memberIds: ID[];
};

export type Member = {
  id: ID;
  name: string;
  title: string;
  role: TeamRole;
  timezone: string;
  avatarSeed: string;
};

export type DemoUser = {
  id: ID;
  name: string;
  email: string;
  memberId: ID;
  teamIds: ID[];
  defaultTeamId: ID;
};

export type MetricPoint = {
  t: ISODate;
  v: number;
};

export type MetricSeries = {
  id: ID;
  teamId: ID;
  label: string;
  unit: "percent" | "count" | "score";
  points: MetricPoint[];
};

export type KeyResult = {
  id: ID;
  title: string;
  ownerId: ID;
  unit: "percent" | "count" | "score";
  current: number;
  target: number;
  confidence: number; // 0..1
  sparkline: number[];
};

export type CheckIn = {
  id: ID;
  at: ISODate;
  authorId: ID;
  note: string;
  confidence: number; // 0..1
};

export type OKR = {
  id: ID;
  teamId: ID;
  objective: string;
  timeframe: string;
  ownerId: ID;
  tags: string[];
  keyResults: KeyResult[];
  checkIns: CheckIn[];
};

export type Milestone = {
  id: ID;
  title: string;
  date: ISODate; // date-time for ordering
  status: "Done" | "Next" | "Blocked";
  detail: string;
};

export type Project = {
  id: ID;
  teamId: ID;
  name: string;
  ownerId: ID;
  status: "Active" | "Planning" | "Paused" | "Complete";
  health: TeamHealth;
  start: ISODate;
  end: ISODate;
  tags: string[];
  milestones: Milestone[];
  dependencies: Array<{ projectId: ID; note: string }>;
  riskFlags: string[];
};

export type Initiative = {
  id: ID;
  teamId: ID;
  name: string;
  ownerId: ID;
  health: TeamHealth;
  start: ISODate;
  end: ISODate;
  progress: number; // 0..1
  linkedProjectIds: ID[];
};

export type Signal = {
  id: ID;
  teamId: ID;
  type: SignalType;
  title: string;
  detail: string;
  severity: 1 | 2 | 3 | 4 | 5;
  createdAt: ISODate;
  related?: {
    okrId?: ID;
    projectId?: ID;
  };
};

export type Ritual = {
  id: ID;
  teamId: ID;
  title: string;
  cadence: "Weekly" | "Biweekly" | "Monthly";
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  timeUtc: string; // HH:MM
  ownerId: ID;
};

export type DemoData = {
  users: DemoUser[];
  teams: Team[];
  members: Member[];
  okrs: OKR[];
  initiatives: Initiative[];
  projects: Project[];
  signals: Signal[];
  series: MetricSeries[];
  rituals: Ritual[];
};

