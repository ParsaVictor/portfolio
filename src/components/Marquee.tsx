import { Fragment } from "react";
import ScrollVelocity from "./bits/ScrollVelocity";
import { useLang } from "../i18n/LangProvider";

/**
 * The strip between the hero and the about acts.
 *
 * Two rows running against each other (React Bits' ScrollVelocity). They idle
 * at a walk and surge with the scroll — Lenis drives window.scrollY, so the
 * strip feels the same eased momentum as everything else on the page — and
 * lean into the direction of travel. The second row is outlined, so the eye
 * reads one line and only feels the other.
 */
export default function Marquee() {
  const { t } = useLang();
  const words = t.marquee;
  const half = Math.ceil(words.length / 2);
  const rows = [words.slice(0, half), words.slice(half)];

  return (
    <div
      dir="ltr"
      aria-label={words.join(" · ")}
      className="relative z-10 overflow-hidden border-y border-bone/10 bg-ink/50 py-5 backdrop-blur-sm md:py-6"
    >
      <ScrollVelocity
        texts={rows.map((row, r) => (
          <span key={r} className="inline-flex items-center">
            {row.map((w, i) => (
              <Fragment key={w + i}>
                <span>{w}</span>
                <span
                  aria-hidden
                  className="mx-[0.7em] text-[0.55em]"
                  style={{
                    color: r === 0 ? "#35e0ff" : "#ffb454",
                    // the outlined row clears its fill — the star keeps a solid one
                    WebkitTextFillColor: r === 0 ? "#35e0ff" : "#ffb454",
                    WebkitTextStroke: "0",
                  }}
                >
                  ✦
                </span>
              </Fragment>
            ))}
          </span>
        ))}
        velocity={38}
        numCopies={4}
        damping={50}
        stiffness={400}
        velocityMapping={{ input: [0, 1000], output: [0, 3] }}
        skewWithVelocity={6}
        outlineAlternate
        fadeEdges
        fontSize="clamp(1.35rem, 3.4vw, 2.6rem)"
        fontWeight={700}
        color="rgba(242,236,225,0.78)"
        className="font-display uppercase tracking-[0.02em]"
        parallaxClassName="py-1"
      />
    </div>
  );
}
