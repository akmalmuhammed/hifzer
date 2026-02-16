"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Pause, Play, Repeat2, Zap } from "lucide-react";
import { audioUrl } from "@/hifzer/audio/config";
import { claimSinglePlayback, releaseSinglePlayback } from "@/components/audio/single-playback";

const SPEEDS = [0.75, 1, 1.25] as const;

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AyahAudioPlayer(props: {
  ayahId: number;
  reciterId?: string;
  className?: string;
}) {
  const src = useMemo(
    () => audioUrl(props.reciterId ?? "default", props.ayahId),
    [props.ayahId, props.reciterId],
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatLeftRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const speed = SPEEDS[speedIndex] ?? 1;
  const progress01 = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const audioEl: HTMLAudioElement = audio;

    function syncTime() {
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
      setPlaying(false);
      syncTime();
    }

    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("ended", onEnded);
    return () => {
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("ended", onEnded);
      releaseSinglePlayback(audioEl);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.playbackRate = speed;
  }, [speed]);

  async function onTogglePlayback() {
    const audio = audioRef.current;
    if (!audio || !src) {
      return;
    }

    if (audio.paused) {
      claimSinglePlayback(audio);
      repeatLeftRef.current = Math.max(0, repeatCount - 1);
      audio.playbackRate = speed;
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
      return;
    }

    audio.pause();
  }

  const disabled = !src;

  return (
    <div
      className={clsx(
        "rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 shadow-[var(--kw-shadow-soft)]",
        props.className,
      )}
    >
      <audio ref={audioRef} src={src ?? undefined} preload="none" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onTogglePlayback()}
            disabled={disabled}
            className={clsx(
              "grid h-9 w-9 place-items-center rounded-2xl border shadow-[var(--kw-shadow-soft)] transition",
              disabled
                ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
                : "border-[rgba(43,75,255,0.22)] bg-[rgba(43,75,255,0.10)] text-[rgba(31,54,217,1)] hover:bg-[rgba(43,75,255,0.14)]",
            )}
            aria-label={disabled ? "Audio not configured" : playing ? "Pause" : "Play"}
            title={disabled ? "Audio base URL not configured" : playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Audio
              </p>
              {disabled ? (
                <span className="truncate text-xs text-[color:var(--kw-muted)]">Not configured</span>
              ) : (
                <span className="text-xs text-[color:var(--kw-muted)]">
                  {formatSeconds(currentTime)} / {formatSeconds(duration)}
                </span>
              )}
            </div>
            <div className="mt-1 h-1.5 w-44 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[rgba(31,54,217,0.75)] transition-[width]"
                style={{ width: `${progress01 * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setRepeatCount((v) => (v >= 5 ? 1 : v + 1))}
            className={clsx(
              "inline-flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-xs font-semibold shadow-[var(--kw-shadow-soft)] transition",
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
            onClick={() => setSpeedIndex((v) => (v + 1) % SPEEDS.length)}
            className={clsx(
              "inline-flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-xs font-semibold shadow-[var(--kw-shadow-soft)] transition",
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
        </div>
      </div>
    </div>
  );
}
