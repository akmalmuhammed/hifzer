"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Forward, Pause, Play, Repeat2, Volume2, Zap } from "lucide-react";
import { audioUrl } from "@/hifzer/audio/config";
import {
  type AudioPlaybackMode,
  readPersistedAudioPlaybackMode,
} from "@/hifzer/audio/playback-mode";
import { parseQuranFoundationReciterId } from "@/hifzer/audio/reciters";
import { claimSinglePlayback, releaseSinglePlayback } from "@/components/audio/single-playback";

const SPEEDS = [0.75, 1, 1.25] as const;

type RemoteAudioPayload = {
  audio?: {
    status: "available" | "not_configured" | "degraded" | "not_found";
    detail: string;
    verseKey: string;
    recitationId: number | null;
    recitationLabel: string | null;
    url: string | null;
  };
};

function readPersistedSpeedIndex(prefKey: string | undefined): number {
  if (typeof window === "undefined" || !prefKey) {
    return 1;
  }
  try {
    const raw = window.localStorage.getItem(prefKey);
    if (!raw) {
      return 1;
    }
    const parsed = Number(raw);
    const index = SPEEDS.findIndex((value) => value === parsed);
    return index >= 0 ? index : 1;
  } catch {
    return 1;
  }
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function syncAudioSource(audio: HTMLAudioElement, nextSrc: string) {
  if (audio.src === nextSrc || audio.currentSrc === nextSrc) {
    return;
  }
  audio.src = nextSrc;
  audio.load();
}

export function AyahAudioPlayer(props: {
  ayahId: number;
  reciterId?: string;
  playbackMode?: AudioPlaybackMode;
  className?: string;
  streakTrackSource?: "quran_browse";
  trailingControl?: ReactNode;
  autoPlayPrefKey?: string;
  speedPrefKey?: string;
  onAutoAdvance?: () => void;
}) {
  const localSrc = audioUrl(props.reciterId ?? "default", props.ayahId);
  const playerKey = `${props.reciterId ?? "default"}:${props.ayahId}:${props.playbackMode ?? "stored"}`;
  return <AyahAudioPlayerInner key={playerKey} {...props} localSrc={localSrc} />;
}

function AyahAudioPlayerInner(props: {
  ayahId: number;
  reciterId?: string;
  playbackMode?: AudioPlaybackMode;
  className?: string;
  streakTrackSource?: "quran_browse";
  trailingControl?: ReactNode;
  autoPlayPrefKey?: string;
  speedPrefKey?: string;
  onAutoAdvance?: () => void;
  localSrc: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatLeftRef = useRef(0);
  const streakMarkedRef = useRef(false);
  const isScrubbingRef = useRef(false);
  const speedRef = useRef(1);
  const repeatCountRef = useRef(1);
  const remoteAttemptedRef = useRef(false);
  const pendingResumeRef = useRef(false);
  const sourceKindRef = useRef<"local" | "quran_foundation" | "unavailable">("unavailable");
  const playbackMode = props.playbackMode ?? readPersistedAudioPlaybackMode();
  const remoteReciterSelected = parseQuranFoundationReciterId(props.reciterId ?? "default") != null;
  const remoteAllowed = remoteReciterSelected || playbackMode !== "local_only";
  const remotePreferred = remoteReciterSelected || playbackMode === "quran_foundation_first";
  const initialSourceKind = props.localSrc && !remotePreferred ? "local" : "unavailable";
  const initialSourceDetail = props.localSrc
    ? remotePreferred
      ? "Quran.com audio will be tried first for this ayah."
      : "Playing from the local Hifzer audio library."
    : remoteAllowed
      ? "No local audio file was found, so Hifzer will try Quran.com when you play."
      : "No local audio file is available for this ayah in local-only mode.";
  const activeSrcRef = useRef<string | null>(initialSourceKind === "local" ? props.localSrc : null);

  const [playing, setPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [speedIndex, setSpeedIndex] = useState(() => readPersistedSpeedIndex(props.speedPrefKey));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [activeSrc, setActiveSrc] = useState<string | null>(activeSrcRef.current);
  const [sourceKind, setSourceKind] = useState<"local" | "quran_foundation" | "unavailable">(initialSourceKind);
  const [sourceDetail, setSourceDetail] = useState<string | null>(initialSourceDetail);
  const [resolvingFallback, setResolvingFallback] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(() => {
    if (typeof window === "undefined" || !props.autoPlayPrefKey) {
      return false;
    }
    try {
      return window.localStorage.getItem(props.autoPlayPrefKey) === "1";
    } catch {
      return false;
    }
  });

  const speed = SPEEDS[speedIndex] ?? 1;
  const progress01 = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const autoAdvanceEnabledRef = useRef(autoPlayEnabled);
  const onAutoAdvanceRef = useRef(props.onAutoAdvance);

  useEffect(() => {
    sourceKindRef.current = sourceKind;
  }, [sourceKind]);

  const markStreakRecitation = useCallback(async () => {
    if (props.streakTrackSource !== "quran_browse" || streakMarkedRef.current) {
      return;
    }
    try {
      const res = await fetch("/api/streak/recite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          ayahId: props.ayahId,
          source: "quran_browse",
        }),
      });
      if (res.ok) {
        streakMarkedRef.current = true;
      }
    } catch {
      // Fail open: playback still works even if streak logging fails.
    }
  }, [props.ayahId, props.streakTrackSource]);

  const switchToLocalSource = useCallback((detail: string) => {
    if (!props.localSrc) {
      return null;
    }
    setActiveSrc(props.localSrc);
    setSourceKind("local");
    setSourceDetail(detail);
    setLoadError(false);
    return props.localSrc;
  }, [props.localSrc]);

  const resolveRemoteFallback = useCallback(async () => {
    if (!remoteAllowed) {
      return null;
    }
    if (remoteAttemptedRef.current || resolvingFallback) {
      return sourceKindRef.current === "quran_foundation" ? activeSrcRef.current : null;
    }
    remoteAttemptedRef.current = true;
    setResolvingFallback(true);
    try {
      const response = await fetch(
        `/api/quran/audio-source?ayahId=${encodeURIComponent(String(props.ayahId))}&reciterId=${encodeURIComponent(
          props.reciterId ?? "default",
        )}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as RemoteAudioPayload | null;
      const remoteAudio = payload?.audio;
      if (!response.ok || !remoteAudio?.url) {
        setSourceDetail(remoteAudio?.detail ?? "Audio is unavailable for this ayah.");
        pendingResumeRef.current = false;
        if (props.localSrc && sourceKindRef.current !== "local") {
          return switchToLocalSource("Quran.com audio was unavailable, so Hifzer switched back to local audio.");
        }
        setLoadError(true);
        setPlaying(false);
        return null;
      }
      setActiveSrc(remoteAudio.url);
      setSourceKind("quran_foundation");
      setSourceDetail(remoteAudio.detail);
      setLoadError(false);
      return remoteAudio.url;
    } catch {
      setSourceDetail("Could not reach Quran.com audio right now.");
      pendingResumeRef.current = false;
      if (props.localSrc && sourceKindRef.current !== "local") {
        return switchToLocalSource("Quran.com audio could not be reached, so Hifzer switched back to local audio.");
      }
      setLoadError(true);
      setPlaying(false);
      return null;
    } finally {
      setResolvingFallback(false);
    }
  }, [props.ayahId, props.localSrc, props.reciterId, remoteAllowed, resolvingFallback, switchToLocalSource]);

  const ensureSourceReady = useCallback(async () => {
    if (remotePreferred) {
      const remoteSource = await resolveRemoteFallback();
      if (remoteSource) {
        return remoteSource;
      }
      return switchToLocalSource("Playing from the local Hifzer audio library.");
    }
    if (activeSrcRef.current) {
      return activeSrcRef.current;
    }
    if (props.localSrc) {
      return switchToLocalSource("Playing from the local Hifzer audio library.");
    }
    if (remoteAllowed) {
      return resolveRemoteFallback();
    }
    setLoadError(true);
    setSourceDetail("Local-only mode is enabled, and no local audio file is available for this ayah.");
    return null;
  }, [props.localSrc, remoteAllowed, remotePreferred, resolveRemoteFallback, switchToLocalSource]);

  useEffect(() => {
    activeSrcRef.current = activeSrc;
  }, [activeSrc]);

  useEffect(() => {
    const nextSourceKind = props.localSrc && !remotePreferred ? "local" : "unavailable";
    remoteAttemptedRef.current = false;
    pendingResumeRef.current = false;
    const nextSrc = nextSourceKind === "local" ? props.localSrc : null;
    setActiveSrc(nextSrc);
    setSourceKind(nextSourceKind);
    setSourceDetail(
      props.localSrc
        ? remotePreferred
          ? "Quran.com audio will be tried first for this ayah."
          : "Playing from the local Hifzer audio library."
        : remoteAllowed
          ? "No local audio file was found, so Hifzer will try Quran.com when you play."
          : "No local audio file is available for this ayah in local-only mode.",
    );
    setLoadError(false);
    setCurrentTime(0);
    setDuration(0);
  }, [props.localSrc, remoteAllowed, remotePreferred]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const audioEl: HTMLAudioElement = audio;

    function syncTime() {
      if (isScrubbingRef.current) {
        return;
      }
      setCurrentTime(audioEl.currentTime);
      setDuration(Number.isFinite(audioEl.duration) ? audioEl.duration : 0);
    }

    function onPlay() {
      setPlaying(true);
      syncTime();
    }

    function onPause() {
      setPlaying(false);
      syncTime();
    }

    function onTimeUpdate() {
      syncTime();
    }

    function onEnded() {
      if (repeatLeftRef.current > 0) {
        repeatLeftRef.current -= 1;
        audioEl.currentTime = 0;
        void audioEl.play().catch(() => {
          setPlaying(false);
        });
        return;
      }
      pendingResumeRef.current = false;
      setPlaying(false);
      syncTime();
      if (autoAdvanceEnabledRef.current) {
        onAutoAdvanceRef.current?.();
      }
    }

    function onError() {
      setPlaying(false);
      if (sourceKindRef.current === "local" && remoteAllowed && !remoteAttemptedRef.current) {
        void (async () => {
          const nextSource = await resolveRemoteFallback();
          const target = audioRef.current;
          if (!nextSource || !target) {
            return;
          }
          syncAudioSource(target, nextSource);
          target.playbackRate = speedRef.current;
          if (pendingResumeRef.current) {
            claimSinglePlayback(target);
            try {
              await target.play();
              void markStreakRecitation();
            } catch {
              setPlaying(false);
            }
          }
        })();
        return;
      }
      if (sourceKindRef.current === "quran_foundation" && props.localSrc) {
        const nextSource = switchToLocalSource("Quran.com audio failed, so Hifzer switched back to local audio.");
        const target = audioRef.current;
        if (nextSource && target) {
          syncAudioSource(target, nextSource);
          target.playbackRate = speedRef.current;
          if (pendingResumeRef.current) {
            claimSinglePlayback(target);
            void target.play().catch(() => {
              setPlaying(false);
            });
          }
        }
        return;
      }
      setLoadError(true);
    }

    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("error", onError);
    return () => {
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("error", onError);
      releaseSinglePlayback(audioEl);
    };
  }, [markStreakRecitation, props.localSrc, remoteAllowed, resolveRemoteFallback, switchToLocalSource]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (!props.speedPrefKey || typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(props.speedPrefKey, String(speed));
    } catch {
      // ignore storage write failures
    }
  }, [props.speedPrefKey, speed]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    repeatCountRef.current = repeatCount;
  }, [repeatCount]);

  useEffect(() => {
    autoAdvanceEnabledRef.current = autoPlayEnabled;
  }, [autoPlayEnabled]);

  useEffect(() => {
    onAutoAdvanceRef.current = props.onAutoAdvance;
  }, [props.onAutoAdvance]);

  useEffect(() => {
    streakMarkedRef.current = false;
  }, [props.ayahId, props.streakTrackSource]);

  useEffect(() => {
    let cancelled = false;
    if (!props.autoPlayPrefKey || !autoPlayEnabled) {
      return;
    }

    void (async () => {
      const source = await ensureSourceReady();
      const audio = audioRef.current;
      if (cancelled || !audio || !source) {
        return;
      }
      pendingResumeRef.current = true;
      claimSinglePlayback(audio);
      repeatLeftRef.current = Math.max(0, repeatCountRef.current - 1);
      audio.playbackRate = speedRef.current;
      syncAudioSource(audio, source);
      audio.currentTime = 0;
      void audio.play().then(() => {
        void markStreakRecitation();
      }).catch(() => {
        setPlaying(false);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [autoPlayEnabled, ensureSourceReady, markStreakRecitation, props.autoPlayPrefKey]);

  async function onTogglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      const source = await ensureSourceReady();
      if (!source) {
        return;
      }
      pendingResumeRef.current = true;
      claimSinglePlayback(audio);
      repeatLeftRef.current = Math.max(0, repeatCount - 1);
      audio.playbackRate = speed;
      syncAudioSource(audio, source);
      try {
        await audio.play();
        void markStreakRecitation();
      } catch {
        setPlaying(false);
      }
      return;
    }

    pendingResumeRef.current = false;
    audio.pause();
  }

  function seekToTime(nextTime: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(duration, nextTime));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function onSeekInput(rawValue: string) {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }
    seekToTime(value);
  }

  const disabled = (!activeSrc && resolvingFallback) || loadError;

  function toggleAutoPlay() {
    const prefKey = props.autoPlayPrefKey;
    if (!prefKey) {
      return;
    }
    setAutoPlayEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(prefKey, next ? "1" : "0");
      } catch {
        // ignore storage write failures
      }
      return next;
    });
  }

  return (
    <div
      className={clsx(
        "rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-2 shadow-[var(--kw-shadow-soft)] sm:px-3",
        props.className,
      )}
    >
      <audio ref={audioRef} src={activeSrc ?? undefined} preload="none" />

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => void onTogglePlayback()}
            disabled={disabled}
            className={clsx(
              "grid h-8 w-8 place-items-center rounded-2xl border shadow-[var(--kw-shadow-soft)] transition sm:h-9 sm:w-9",
              disabled
                ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
                : "border-[rgba(43,75,255,0.22)] bg-[rgba(43,75,255,0.10)] text-[rgba(31,54,217,1)] hover:bg-[rgba(43,75,255,0.14)]",
            )}
            aria-label={
              loadError ? "Audio unavailable" : resolvingFallback ? "Loading audio" : playing ? "Pause" : "Play"
            }
            title={
              loadError
                ? "Audio is unavailable for this reciter"
                : resolvingFallback
                  ? "Loading Quran.com audio"
                  : playing
                    ? "Pause"
                    : "Play"
            }
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Audio
              </p>
              {loadError ? (
                <span className="truncate text-xs text-[color:var(--kw-muted)]">Unavailable</span>
              ) : resolvingFallback ? (
                <span className="truncate text-xs text-[color:var(--kw-muted)]">Loading</span>
              ) : activeSrc ? (
                <span className="text-xs text-[color:var(--kw-muted)]">
                  {formatSeconds(currentTime)} / {formatSeconds(duration)}
                </span>
              ) : (
                <span className="truncate text-xs text-[color:var(--kw-muted)]">Ready on demand</span>
              )}
            </div>
            <div className="relative mt-1 w-28 sm:w-44">
              <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-[rgba(31,54,217,0.75)] transition-[width]"
                  style={{ width: `${progress01 * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 0}
                step={0.01}
                value={currentTime}
                disabled={disabled || duration <= 0}
                onPointerDown={() => {
                  isScrubbingRef.current = true;
                }}
                onPointerUp={() => {
                  isScrubbingRef.current = false;
                }}
                onBlur={() => {
                  isScrubbingRef.current = false;
                }}
                onInput={(event) => onSeekInput(event.currentTarget.value)}
                onChange={(event) => onSeekInput(event.currentTarget.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                aria-label="Seek audio position"
                title="Drag to seek"
              />
            </div>
            {sourceDetail ? (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] leading-5 text-[color:var(--kw-muted)]">
                <Volume2 size={12} className="shrink-0" />
                <span className="truncate">
                  {sourceKind === "quran_foundation" ? "Quran.com" : "Hifzer local"} · {sourceDetail}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setRepeatCount((value) => (value >= 10 ? 1 : value + 1))}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-2xl border px-2 py-1.5 text-[11px] font-semibold shadow-[var(--kw-shadow-soft)] transition sm:gap-2 sm:px-2.5 sm:py-2 sm:text-xs",
              disabled
                ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
                : "border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink)] hover:bg-white",
            )}
            aria-label="Repeat count"
            title="Repeat"
          >
            <Repeat2 size={14} />
            <span>x{repeatCount}</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setSpeedIndex((value) => (value + 1) % SPEEDS.length)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-2xl border px-2 py-1.5 text-[11px] font-semibold shadow-[var(--kw-shadow-soft)] transition sm:gap-2 sm:px-2.5 sm:py-2 sm:text-xs",
              disabled
                ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
                : "border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink)] hover:bg-white",
            )}
            aria-label="Playback speed"
            title="Speed"
          >
            <Zap size={14} />
            <span>{speed}x</span>
          </button>

          {props.autoPlayPrefKey ? (
            <button
              type="button"
              disabled={disabled}
              onClick={toggleAutoPlay}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-2xl border px-2 py-1.5 text-[11px] font-semibold shadow-[var(--kw-shadow-soft)] transition sm:gap-2 sm:px-2.5 sm:py-2 sm:text-xs",
                disabled
                  ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
                  : autoPlayEnabled
                    ? "border-[rgba(var(--kw-accent-rgb),0.30)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)] hover:bg-[rgba(var(--kw-accent-rgb),0.18)]"
                    : "border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-ink)] hover:bg-white",
              )}
              aria-label={autoPlayEnabled ? "Auto play and advance is on" : "Auto play and advance is off"}
              title={autoPlayEnabled ? "Auto play and advance is on" : "Auto play and advance is off"}
            >
              <Forward size={14} />
              <span>{autoPlayEnabled ? "Auto on" : "Auto off"}</span>
            </button>
          ) : null}

          {props.trailingControl ? <div className="shrink-0">{props.trailingControl}</div> : null}
        </div>
      </div>
    </div>
  );
}
