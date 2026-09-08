import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "./Reveal";
import { StageCopy } from "./VisionRail";
import { useLang } from "../i18n/LangProvider";
import { dataProjects, desc, type Project } from "../data/projects";
import { STAGE_COLORS } from "../config";
import { clamp, digits } from "../lib/num";

gsap.registerPlugin(ScrollTrigger);

const ACCENT = STAGE_COLORS.data;

/**
 * Neural networks & data.
 *
 * Copy and projects run down one side as a scroll-focused list; a live
 * telemetry panel floats on the other, layered over the particle lattice so
 * the swarm reads as the thing being measured.
 */
export default function DataConsole() {
  const { t, lang } = useLang();

  return (
    <section id="data" data-scene="2" className="relative py-20 md:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-14">
          {/* ── left: copy + scroll-focused project rows ─────────────── */}
          <div>
            <StageCopy accent={ACCENT} meta={t.data} />

            <div className="mt-12 border-t border-bone/10">
              {dataProjects.map((p, i) => (
                <FocusRow key={p.id} project={p} index={i} lang={lang} view={t.project.view} />
              ))}
            </div>
          </div>

          {/* ── right: telemetry over the lattice ────────────────────── */}
          <Reveal variant="up" duration={900} delay={120} className="lg:sticky lg:top-28 lg:self-start">
            <Telemetry label={t.data.console} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- the rows */

function FocusRow({
  project,
  index,
  lang,
  view,
}: {
  project: Project;
  index: number;
  lang: "en" | "fa";
  view: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--focus", "1");
      return;
    }
    // brightest as the row crosses the middle of the viewport, dim either side
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      end: "bottom 15%",
      onUpdate: (self) => {
        const f = Math.sin(clamp(self.progress, 0, 1) * Math.PI);
        el.style.setProperty("--focus", String(Math.pow(f, 0.6)));
      },
    });
    return () => st.kill();
  }, []);

  return (
    <a
      ref={ref}
      href={project.url}
      target="_blank"
      rel="noreferrer"
      data-cursor-hover
      className="group relative grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-3 border-b border-bone/10 py-7 sm:grid-cols-[auto_1fr_auto] sm:py-9"
      style={{
        ["--focus" as string]: "0.25",
        opacity: "calc(0.42 + var(--focus) * 0.58)",
        transition: "opacity 120ms linear",
      }}
    >
      {/* the focus bar that rides the list as you scroll */}
      <span
        aria-hidden
        className="absolute inset-y-0 start-0 w-px origin-center"
        style={{ background: ACCENT, transform: "scaleY(var(--focus))", opacity: 0.9 }}
      />

      <span className="ps-4 font-mono text-[11px] tabular-nums tracking-[0.28em] text-dim ltr sm:ps-5">
        {digits(String(index + 1).padStart(2, "0"), lang)}
      </span>

      <div className="min-w-0">
        <h3 className="text-lg font-bold text-bone transition-colors group-hover:text-[color:var(--accent)] sm:text-2xl ltr"
          style={{ ["--accent" as string]: project.accent }}
        >
          {project.title}
        </h3>
        <p className="mt-2 max-w-xl text-[13.5px] leading-7 text-bone/55">{desc(project, lang)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] tracking-widest text-dim ltr">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="col-span-2 flex items-center gap-2 ps-4 text-xs font-semibold sm:col-span-1 sm:ps-0" style={{ color: project.accent }}>
        <span className="font-mono text-[10px] tracking-widest ltr">{project.stat}</span>
        <span className="mx-1 hidden h-px w-6 sm:block" style={{ background: project.accent }} />
        <span className="hidden sm:inline">{view}</span>
        <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </a>
  );
}

/* --------------------------------------------------------------- telemetry */

const MATRIX_COLS = 6;
const MATRIX_ROWS = 5;

function Telemetry({ label }: { label: string }) {
  const [cells, setCells] = useState<string[]>(() =>
    Array.from({ length: MATRIX_COLS * MATRIX_ROWS }, () => "0.00")
  );
  const [epoch, setEpoch] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // a slow tick, not a rAF loop: it keeps reading "live" without burning frames
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setCells((prev) =>
        prev.map((v) => (Math.random() < 0.28 ? (Math.random() * 2 - 1).toFixed(2) : v))
      );
      setEpoch((e) => (e + 1) % 1000);
    }, 260);
    return () => window.clearInterval(id);
  }, []);

  // the loss curve draws itself as the section passes
  useEffect(() => {
    const path = pathRef.current;
    const box = boxRef.current;
    if (!path || !box) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      return;
    }
    const st = ScrollTrigger.create({
      trigger: box,
      start: "top 85%",
      end: "bottom 40%",
      onUpdate: (self) => {
        path.style.strokeDashoffset = String(len * (1 - clamp(self.progress, 0, 1)));
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div
      ref={boxRef}
      dir="ltr"
      className="rounded-2xl border border-bone/12 bg-ink/70 p-5 font-mono text-[11px] backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-bone/10 pb-3">
        <span className="tracking-[0.24em] text-bone/70">{label}</span>
        <span className="flex items-center gap-1.5 text-[10px] text-dim">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: ACCENT }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
          </span>
          LIVE
        </span>
      </div>

      {/* loss curve */}
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-[10px] text-dim">
          <span>train_loss</span>
          <span className="tabular-nums">epoch {String(epoch).padStart(3, "0")}</span>
        </div>
        <svg viewBox="0 0 300 78" className="h-[78px] w-full" aria-hidden>
          {[0, 1, 2, 3].map((r) => (
            <line
              key={r}
              x1="0"
              x2="300"
              y1={r * 26}
              y2={r * 26}
              stroke="rgba(237,240,247,0.07)"
              strokeWidth="1"
            />
          ))}
          <path
            ref={pathRef}
            d="M0 6 C 40 10, 52 44, 78 50 S 120 62, 148 58 S 196 66, 224 69 S 272 72, 300 73"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* tensor matrix */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] text-dim">tensor[5, 6] · float32</div>
        <div
          className="grid gap-x-2 gap-y-1 tabular-nums"
          style={{ gridTemplateColumns: "repeat(" + MATRIX_COLS + ", minmax(0, 1fr))" }}
        >
          {cells.map((v, i) => (
            <span
              key={i}
              className="text-[10px] text-bone/45 transition-colors duration-300"
              style={v.startsWith("-") ? undefined : { color: "rgba(157,140,255,0.85)" }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* readouts */}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-bone/10 pt-4 text-[10px]">
        {[
          ["params", "11.2M"],
          ["throughput", "60 fps"],
          ["classes", "50"],
          ["annotations", "675K"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-2">
            <dt className="text-dim">{k}</dt>
            <dd className="tabular-nums text-bone/80">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
