import { useEffect, useState } from "react";
import type { Project } from "../data/projects";

/**
 * Which project is open in the detail overlay. A module store rather than
 * context, so any card anywhere can open it without threading a provider
 * through three differently shaped section layouts.
 */
let current: Project | null = null;
const listeners = new Set<(p: Project | null) => void>();

export function openProject(p: Project) {
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
