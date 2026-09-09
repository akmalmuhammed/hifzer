import { afterEach, describe, expect, it, vi } from "vitest";
import type { JournalEntry } from "./local-store";
import type { JournalPendingMutation } from "./sync-queue";
import {
  importLegacyJournalEntries,
  sendPendingJournalMutation,
} from "./sync-transport";

const target = { scope: "account", ownerId: "user_a" } as const;

function entry(id = "local-note", version = 1): JournalEntry {
  return {
    id,
    version,
    type: "reflection",
    title: "Private note",
    content: "Body",
    blocks: [{ id: "block-1", kind: "text", content: "Body" }],
    tags: [],
    pinned: false,
    createdAt: "2026-09-05T00:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  };
}

function createMutation(): JournalPendingMutation {
  return {
    type: "create",
    entry: entry(),
    clientMutationId: "mutation-create",
    queuedAt: "2026-09-05T00:00:00.000Z",
    attemptCount: 1,
    lastAttemptAt: "2026-09-05T00:00:01.000Z",
    lastFailure: null,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("journal sync transport", () => {
  it("binds a create to its owner and accepts a full validated entry", async () => {
    const canonical = entry("server-note", 1);
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, entry: canonical }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendPendingJournalMutation(target, createMutation())).resolves.toEqual({
      ok: true,
      entry: canonical,
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      ownerId: "user_a",
      clientMutationId: "mutation-create",
      mutationType: "create",
      expectedVersion: null,
    });
  });

  it("keeps a save retryable when a 2xx response lacks a full entry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true })));

    await expect(sendPendingJournalMutation(target, createMutation())).resolves.toMatchObject({
      ok: false,
      code: "INVALID_SUCCESS_PAYLOAD",
      retryable: true,
    });
  });

  it("preserves a validated authoritative conflict snapshot", async () => {
    const authoritativeEntry = entry("server-note", 3);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      error: "Changed elsewhere",
      code: "VERSION_CONFLICT",
      authoritativeEntry,
    }, { status: 409 })));

    await expect(sendPendingJournalMutation(target, createMutation())).resolves.toMatchObject({
      ok: false,
      conflict: true,
      authoritativeEntryKnown: true,
      authoritativeEntry,
    });
  });

  it("accepts an acknowledged delete without requiring an entry payload", async () => {
    const mutation: JournalPendingMutation = {
      type: "delete",
      entryId: "server-note",
      expectedVersion: 2,
      clientMutationId: "mutation-delete",
      queuedAt: "2026-09-05T00:00:00.000Z",
      attemptCount: 1,
      lastAttemptAt: "2026-09-05T00:00:01.000Z",
      lastFailure: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendPendingJournalMutation(target, mutation)).resolves.toEqual({ ok: true, entry: null });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("ownerId=user_a");
  });

  it("does not dequeue a delete for an unacknowledged 2xx response", async () => {
    const mutation: JournalPendingMutation = {
      type: "delete",
      entryId: "server-note",
      expectedVersion: 2,
      clientMutationId: "mutation-delete",
      queuedAt: "2026-09-05T00:00:00.000Z",
      attemptCount: 1,
      lastAttemptAt: "2026-09-05T00:00:01.000Z",
      lastFailure: null,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: false })));

    await expect(sendPendingJournalMutation(target, mutation)).resolves.toMatchObject({
      ok: false,
      code: "INVALID_SUCCESS_PAYLOAD",
      retryable: true,
    });
  });

  it("classifies a transport exception as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(sendPendingJournalMutation(target, createMutation())).resolves.toMatchObject({
      ok: false,
      code: "NETWORK_ERROR",
      retryable: true,
      conflict: false,
    });
  });

  it("batches legacy imports and verifies every source id before cleanup", async () => {
    const accountEntries: JournalEntry[] = [];
    const legacyEntries = Array.from({ length: 201 }, (_, index) => entry(`legacy-${index}`));
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { ownerId: string; entries: JournalEntry[] };
      expect(body.ownerId).toBe("user_a");
      accountEntries.push(...body.entries.map((source, index) => ({
        ...source,
        id: `server-${accountEntries.length + index}`,
        originEntryId: source.id,
      })));
      return Response.json({
        ok: true,
        entries: accountEntries,
        acknowledgements: body.entries.map((source) => ({
          sourceEntryId: source.id,
          status: "created",
          entry: accountEntries.find((candidate) => candidate.originEntryId === source.id),
        })),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await importLegacyJournalEntries("user_a", legacyEntries);
    expect(result.entries).toHaveLength(201);
    expect(result.acknowledgements).toHaveLength(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retains an earlier-batch source missing from the final account snapshot", async () => {
    let accountEntries: JournalEntry[] = [];
    let callCount = 0;
    const legacyEntries = Array.from({ length: 201 }, (_, index) => entry(`legacy-${index}`));
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      callCount += 1;
      const body = JSON.parse(String(init.body)) as { entries: JournalEntry[] };
      const created = body.entries.map((source) => ({
        ...source,
        id: `server-${source.id}`,
        originEntryId: source.id,
      }));
      if (callCount === 2) {
        accountEntries = accountEntries.filter((candidate) => candidate.originEntryId !== "legacy-0");
      }
      accountEntries.push(...created);
      return Response.json({
        ok: true,
        entries: accountEntries,
        acknowledgements: created.map((candidate) => ({
          sourceEntryId: candidate.originEntryId,
          status: "created",
          entry: candidate,
        })),
      });
    }));

    const result = await importLegacyJournalEntries("user_a", legacyEntries);

    expect(result.acknowledgements.find((item) => item.sourceEntryId === "legacy-0")?.status)
      .toBe("conflict");
    expect(result.acknowledgements.find((item) => item.sourceEntryId === "legacy-200")?.status)
      .toBe("created");
  });

  it("rejects a malformed import success response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true })));

    await expect(importLegacyJournalEntries("user_a", [entry("legacy-1")]))
      .rejects.toThrow("incomplete journal import confirmation");
  });

  it("rejects a valid-looking import response that omits a source id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ok: true,
      entries: [entry("different-server-note")],
      acknowledgements: [],
    })));

    await expect(importLegacyJournalEntries("user_a", [entry("legacy-1")]))
      .rejects.toThrow("did not confirm every journal note");
  });

  it("returns an explicit conflict without treating it as an equivalent-copy acknowledgement", async () => {
    const authoritative = {
      ...entry("server-note", 3),
      originEntryId: "legacy-1",
      content: "Edited account copy",
      blocks: [{ id: "account-block", kind: "text" as const, content: "Edited account copy" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ok: true,
      entries: [authoritative],
      acknowledgements: [{
        sourceEntryId: "legacy-1",
        status: "conflict",
        entry: authoritative,
      }],
    })));

    const result = await importLegacyJournalEntries("user_a", [entry("legacy-1")]);

    expect(result.acknowledgements).toEqual([{
      sourceEntryId: "legacy-1",
      status: "conflict",
      entry: authoritative,
    }]);
  });

  it("fails closed when a confirmed acknowledgement lacks its equivalent account entry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ok: true,
      entries: [entry("server-note")],
      acknowledgements: [{
        sourceEntryId: "legacy-1",
        status: "already-identical",
        entry: null,
      }],
    })));

    await expect(importLegacyJournalEntries("user_a", [entry("legacy-1")]))
      .rejects.toThrow("did not confirm every journal note");
  });

  it("downgrades a transformed create acknowledgement so richer source content is retained", async () => {
    const source = entry("legacy-1");
    const truncated = {
      ...source,
      id: "server-note",
      originEntryId: source.id,
      content: "Bod",
      blocks: [{ id: "server-block", kind: "text" as const, content: "Bod" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ok: true,
      entries: [truncated],
      acknowledgements: [{
        sourceEntryId: source.id,
        status: "created",
        entry: truncated,
      }],
    })));

    const result = await importLegacyJournalEntries("user_a", [source]);

    expect(result.acknowledgements).toMatchObject([{
      sourceEntryId: source.id,
      status: "conflict",
      entry: truncated,
    }]);
  });

  it("retains legacy content that is not represented by its blocks", async () => {
    const source = {
      ...entry("legacy-1"),
      content: "Full legacy body that is absent from the structured block",
      blocks: [{ id: "block-1", kind: "text" as const, content: "Short block" }],
    };
    const imported = {
      ...source,
      id: "server-note",
      originEntryId: source.id,
      title: source.title,
      content: `${source.title}\n\nShort block`,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ok: true,
      entries: [imported],
      acknowledgements: [{
        sourceEntryId: source.id,
        status: "created",
        entry: imported,
      }],
    })));

    const result = await importLegacyJournalEntries("user_a", [source]);

    expect(result.acknowledgements[0]?.status).toBe("conflict");
  });

  it("retains a source when the server transforms a block id", async () => {
    const longBlockId = `block-${"x".repeat(90)}`;
    const source = {
      ...entry("legacy-1"),
      blocks: [{ id: longBlockId, kind: "text" as const, content: "Body" }],
    };
    const imported = {
      ...source,
      id: "server-note",
      originEntryId: source.id,
      blocks: [{ id: longBlockId.slice(0, 80), kind: "text" as const, content: "Body" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ok: true,
      entries: [imported],
      acknowledgements: [{
        sourceEntryId: source.id,
        status: "created",
        entry: imported,
      }],
    })));

    const result = await importLegacyJournalEntries("user_a", [source]);

    expect(result.acknowledgements[0]?.status).toBe("conflict");
  });

  it("rejects duplicate source ids before sending an ambiguous import", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const first = entry("duplicate-source");

    await expect(importLegacyJournalEntries("user_a", [
      first,
      { ...first, content: "Divergent copy" },
    ])).rejects.toThrow("unique stable source id");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
