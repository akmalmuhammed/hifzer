"use client";

import { startTransition, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, MessageSquareText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import type { TeacherCircleHub, TeacherCircleSnapshot, CircleMemberSnapshot } from "@/hifzer/circles/types";

type HubPayload = {
  ok?: boolean;
  hub?: TeacherCircleHub | null;
  error?: string;
};

function selectClasses() {
  return "h-11 w-full rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-sm text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus:bg-[color:var(--kw-surface-strong)] focus:outline-none";
}

function circleKindLabel(kind: TeacherCircleSnapshot["kind"]): string {
  return kind === "FAMILY" ? "Family" : "Halaqah";
}

function checkTone(status: string | null | undefined): "neutral" | "warn" | "success" | "danger" {
  if (status === "PASS" || status === "ATTENDED") {
    return "success";
  }
  if (status === "REVIEW_NEEDED") {
    return "warn";
  }
  if (status === "MISSED" || status === "ABSENT") {
    return "danger";
  }
  return "neutral";
}

export function TeacherCirclesClient({ initialHub }: { initialHub: TeacherCircleHub }) {
  const [hub, setHub] = useState(initialHub);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { pushToast } = useToast();

  const totalMembers = hub.circles.reduce((sum, circle) => sum + circle.memberCount, 0);
  const totalAttended = hub.circles.reduce((sum, circle) => sum + circle.attendanceCount, 0);
  const totalReviewNeeded = hub.circles.reduce((sum, circle) => sum + circle.reviewNeededCount, 0);

  async function submit(body: Record<string, unknown>, successMessage: string, token: string) {
    setSubmitting(token);
    try {
      const res = await fetch("/api/teacher/circles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as HubPayload;
      if (!res.ok || !payload.hub) {
        throw new Error(payload.error || "Request failed.");
      }
      startTransition(() => {
        setHub(payload.hub as TeacherCircleHub);
      });
      pushToast({
        title: "Saved",
        message: successMessage,
        tone: "success",
      });
    } catch (error) {
      pushToast({
        title: "Update failed",
        message: error instanceof Error ? error.message : "Request failed.",
        tone: "warning",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function onCreateCircle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({
      intent: "create_circle",
      name: formData.get("name"),
      kind: formData.get("kind"),
      leadName: formData.get("leadName"),
      description: formData.get("description"),
    }, "Circle created.", "create-circle");
    event.currentTarget.reset();
  }

  async function onAddMember(event: FormEvent<HTMLFormElement>, circleId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({
      intent: "add_member",
      circleId,
      displayName: formData.get("displayName"),
      role: formData.get("role"),
      notes: formData.get("notes"),
    }, "Member added to circle.", `member-${circleId}`);
    event.currentTarget.reset();
  }

  async function onSaveWeeklyCheck(event: FormEvent<HTMLFormElement>, circleId: string, memberId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await submit({
      intent: "save_weekly_check",
      circleId,
      memberId,
      weekStartLocalDate: hub.weekStartLocalDate,
      targetLabel: formData.get("targetLabel"),
      targetStartRef: formData.get("targetStartRef"),
      targetEndRef: formData.get("targetEndRef"),
      attendanceStatus: formData.get("attendanceStatus"),
      oralCheckStatus: formData.get("oralCheckStatus"),
      teacherComment: formData.get("teacherComment"),
      parentComment: formData.get("parentComment"),
    }, "Weekly check updated.", `check-${memberId}`);
  }

  return (
    <div className="space-y-6">
      {!hub.schemaReady ? (
        <Card className="border-[rgba(244,63,94,0.2)] bg-[rgba(244,63,94,0.08)]">
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Circle schema not ready</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Run the latest Prisma migration before using Halaqah / Family Circles. The UI is already shipped; the database tables are what is missing.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <Pill tone="accent">Circles</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{hub.circles.length}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Active Halaqah or family groups owned by this account.</p>
        </Card>
        <Card>
          <Pill tone="neutral">Members</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{totalMembers}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Students, parents, and supervisors active this week.</p>
        </Card>
        <Card>
          <Pill tone="success">Attendance</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{totalAttended}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Members already marked attended for week starting {hub.weekStartLocalDate}.</p>
        </Card>
        <Card>
          <Pill tone="warn">Review needed</Pill>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{totalReviewNeeded}</p>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Members whose oral check still needs correction or retest.</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[color:var(--kw-faint)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Create circle</p>
            </div>
            <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">Start a family or Halaqah supervision loop.</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Each circle keeps one weekly target and oral-check record per member. This is intentionally small-group focused: attendance, oral status, and actionable comments.
            </p>
          </div>
          <Link href="/teacher" className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            Back to teacher dashboard <ArrowRight size={14} />
          </Link>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]" onSubmit={onCreateCircle}>
          <div className="space-y-3">
            <Input name="name" placeholder="Circle name, e.g. Weekend Halaqah" required />
            <Textarea name="description" placeholder="Short note about this circle's cadence or supervision style." className="min-h-[96px]" />
          </div>
          <div className="space-y-3">
            <select name="kind" className={selectClasses()} defaultValue="HALAQAH">
              <option value="HALAQAH">Halaqah</option>
              <option value="FAMILY">Family</option>
            </select>
            <Input name="leadName" placeholder="Lead name, e.g. Ustadh Akmal" />
            <Button type="submit" loading={submitting === "create-circle"} className="w-full">Create circle</Button>
          </div>
        </form>
      </Card>

      {hub.circles.length ? (
        <div className="space-y-4">
          {hub.circles.map((circle) => (
            <Card key={circle.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="accent">{circleKindLabel(circle.kind)}</Pill>
                    <p className="text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">{circle.name}</p>
                  </div>
                  {circle.description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">{circle.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone="neutral">{circle.memberCount} members</Pill>
                  <Pill tone="success">{circle.attendanceCount} attended</Pill>
                  <Pill tone="warn">{circle.reviewNeededCount} review needed</Pill>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="space-y-3">
                  {circle.members.length ? (
                    circle.members.map((member) => (
                      <MemberCheckCard
                        key={member.id}
                        circle={circle}
                        member={member}
                        weekStartLocalDate={hub.weekStartLocalDate}
                        loading={submitting === `check-${member.id}`}
                        onSave={onSaveWeeklyCheck}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No members yet"
                      message="Add students, parents, or teachers to begin weekly oral check tracking."
                    />
                  )}
                </div>

                <Card className="border border-[color:var(--kw-border-2)] bg-white/60">
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 size={16} className="text-[color:var(--kw-faint)]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Add member</p>
                  </div>
                  <form className="mt-4 space-y-3" onSubmit={(event) => void onAddMember(event, circle.id)}>
                    <Input name="displayName" placeholder="Member name" required />
                    <select name="role" className={selectClasses()} defaultValue="STUDENT">
                      <option value="STUDENT">Student</option>
                      <option value="PARENT">Parent</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="LEAD">Lead</option>
                    </select>
                    <Input name="notes" placeholder="Optional note, e.g. listens after Maghrib" />
                    <Button type="submit" loading={submitting === `member-${circle.id}`} className="w-full">Add member</Button>
                  </form>
                </Card>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No circles yet"
            message="Create your first Halaqah or family circle above, then add members and start setting weekly oral-check targets."
            icon={<Users size={18} />}
          />
        </Card>
      )}
    </div>
  );
}

function MemberCheckCard(props: {
  circle: TeacherCircleSnapshot;
  member: CircleMemberSnapshot;
  weekStartLocalDate: string;
  loading: boolean;
  onSave: (event: FormEvent<HTMLFormElement>, circleId: string, memberId: string) => Promise<void>;
}) {
  const { circle, member, weekStartLocalDate, loading, onSave } = props;
  const check = member.currentWeekCheck;

  return (
    <Card className="border border-[color:var(--kw-border-2)] bg-white/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">{member.displayName}</Pill>
            <Pill tone="neutral">{member.role}</Pill>
            {check ? <Pill tone={checkTone(check.attendanceStatus)}>{check.attendanceStatus}</Pill> : null}
            {check ? <Pill tone={checkTone(check.oralCheckStatus)}>{check.oralCheckStatus.replace("_", " ")}</Pill> : null}
          </div>
          {member.notes ? (
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">{member.notes}</p>
          ) : null}
        </div>
        <Pill tone="neutral">Week of {weekStartLocalDate}</Pill>
      </div>

      <form className="mt-4 space-y-3" onSubmit={(event) => void onSave(event, circle.id, member.id)}>
        <Input name="targetLabel" defaultValue={check?.targetLabel ?? ""} placeholder="Weekly target, e.g. Surah Yasin 1-12 with smooth seams" required />
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="targetStartRef" defaultValue={check?.targetStartRef ?? ""} placeholder="Start ref, e.g. 36:1" />
          <Input name="targetEndRef" defaultValue={check?.targetEndRef ?? ""} placeholder="End ref, e.g. 36:12" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select name="attendanceStatus" className={selectClasses()} defaultValue={check?.attendanceStatus ?? "PENDING"}>
            <option value="PENDING">Attendance pending</option>
            <option value="ATTENDED">Attended</option>
            <option value="MISSED">Missed</option>
            <option value="EXCUSED">Excused</option>
          </select>
          <select name="oralCheckStatus" className={selectClasses()} defaultValue={check?.oralCheckStatus ?? "PENDING"}>
            <option value="PENDING">Oral check pending</option>
            <option value="PASS">Passed</option>
            <option value="REVIEW_NEEDED">Review needed</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Textarea name="teacherComment" defaultValue={check?.teacherComment ?? ""} className="min-h-[96px]" placeholder="Teacher comment: weak seams, prompting needed, confidence notes..." />
          <Textarea name="parentComment" defaultValue={check?.parentComment ?? ""} className="min-h-[96px]" placeholder="Parent comment: practice cadence, attendance context, home revision notes..." />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {check?.updatedAt ? (
            <p className="inline-flex items-center gap-2 text-xs text-[color:var(--kw-faint)]">
              <MessageSquareText size={14} />
              Updated {new Date(check.updatedAt).toLocaleString()}
            </p>
          ) : (
            <p className="text-xs text-[color:var(--kw-faint)]">No weekly check recorded yet.</p>
          )}
          <Button type="submit" loading={loading}>Save weekly check</Button>
        </div>
      </form>
    </Card>
  );
}
