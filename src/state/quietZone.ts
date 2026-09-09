import { useEffect, useRef } from "react";

/**
 * Some blocks need the room to themselves.
 *
 * A section can claim quiet while it is on screen; the global particle
 * instrument reads this and pulls itself back so the section's own visual is
 * the only thing competing for attention. Ref-counted, because two claimants
 * overlapping must not cancel each other out.
 */
let target = 0;
const claims = new Set<symbol>();

export const quietZone = { value: 0, get target() { return target; } };

function recompute() {
  target = claims.size > 0 ? 1 : 0;
}

/** Eased each frame by whoever is reading it, so the pull-back is never abrupt. */
export function stepQuiet(dtMs: number) {
  const k = Math.min(1, dtMs / 420);
  quietZone.value += (target - quietZone.value) * k;
  return quietZone.value;
}

/** Claim quiet while `el` is on screen. */
export function useQuietZone<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const token = Symbol("quiet");

    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) claims.add(token);
          else claims.delete(token);
        }
        recompute();
      },
      // claim it well before the block is centred, so the hush arrives first
      { threshold: 0, rootMargin: "-18% 0px -18% 0px" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      claims.delete(token);
      recompute();
    };
  }, [enabled]);

  return ref;
}
