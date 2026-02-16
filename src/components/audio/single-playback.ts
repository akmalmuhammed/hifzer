let active: HTMLAudioElement | null = null;

export function claimSinglePlayback(el: HTMLAudioElement): void {
  if (active && active !== el) {
    try {
      active.pause();
    } catch {
      // ignore
    }
  }
  active = el;
}

export function releaseSinglePlayback(el: HTMLAudioElement): void {
  if (active === el) {
    active = null;
  }
}

