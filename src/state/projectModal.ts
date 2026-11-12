import { useEffect, useState } from "react";
import type { Project } from "../data/projects";

/**
 * Which project is open in the detail overlay. A module store rather than
 * context, so any card anywhere can open it without threading a provider
 * through three differently shaped section layouts.
 */
let current: Project | null = null;
const listeners = new Set<(p: Project | null) => void>();

/**
 * Set when the overlay was opened from a play button rather than from the card
 * itself: the visitor already asked for the film, so it starts at once. Read
 * (and cleared) by the overlay when it mounts the project.
 */
let autoplay = false;
export function takeAutoplay() {
  const a = autoplay;
  autoplay = false;
  return a;
}

export function openProject(p: Project, opts?: { autoplay?: boolean }) {
  autoplay = !!opts?.autoplay && !!p.video;
  current = p;
  listeners.forEach((l) => l(current));
}

export function closeProject() {
  current = null;
  listeners.forEach((l) => l(current));
}

export function useActiveProject() {
  const [p, setP] = useState<Project | null>(current);
  useEffect(() => {
    const fn = (next: Project | null) => setP(next);
    listeners.add(fn);
    setP(current);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return p;
}

/** A plain left-click opens the overlay; modified clicks stay real navigation. */
export function shouldOpenInPage(e: {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
}) {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0;
}
