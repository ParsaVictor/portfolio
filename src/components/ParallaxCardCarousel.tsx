import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import FeaturedBadge from "./FeaturedBadge";

export type CarouselCard = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
  stat?: string;
  /** Drives the card's gradient, glass sheen and active-dot colour. */
  accent: string;
  actionLabel: string;
  onAction?: () => void;
  /** Marks this card as a must-see highlight — violet glow ring + badge. */
  featured?: boolean;
  featuredLabel?: string;
};

type ParallaxCardCarouselProps = {
  cards: CarouselCard[];
  autoplaySpeed?: number;
  enableAutoplay?: boolean;
  cardWidth?: number;
  cardHeight?: number;
  gap?: number;
  perspective?: number;
  maxRotation?: number;
  className?: string;
  onActiveChange?: (index: number, card: CarouselCard) => void;
};

/**
 * A 3D card deck: the active card leans into the cursor and a layered
 * parallax (background / media / copy / glass sheen) drifts underneath it,
 * while the rest of the deck fans out in an arc behind it.
 *
 * The card itself is never given `transform-style: preserve-3d` even though
 * it nests further transformed layers — Chromium hit-tests a preserve-3d
 * element that also clips its own content (`overflow-hidden`) at its
 * *pre-transform* rect, so clicks land in the wrong place once the card is
 * rotated. Each inner layer instead gets its own independent transform,
 * corrected by the shared `perspective` on the deck's container — same
 * look, reliable clicks. (Diagnosed the hard way on this project's other
 * carousel, VisionRail.)
 */
export default function ParallaxCardCarousel({
  cards,
  autoplaySpeed = 5000,
  enableAutoplay = true,
  cardWidth = 340,
  cardHeight = 460,
  gap = 28,
  perspective = 1400,
  maxRotation = 16,
  className = "",
  onActiveChange,
}: ParallaxCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(enableAutoplay);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<number | undefined>(undefined);
  const touchStartRef = useRef(0);
  const N = cards.length;

  useEffect(() => {
    onActiveChange?.(activeIndex, cards[activeIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    const rect = carouselRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setMousePosition({
      x: (e.clientX - centerX) / (rect.width / 2),
      y: (e.clientY - centerY) / (rect.height / 2),
    });
  };

  const goToNext = () => setActiveIndex((p) => (p + 1) % N);
  const goToPrev = () => setActiveIndex((p) => (p - 1 + N) % N);
  const goToIndex = (i: number) => setActiveIndex(i);

  // Autoplay
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (isAutoPlaying && !isHovered) {
      autoplayTimerRef.current = window.setTimeout(goToNext, autoplaySpeed);
    }
    return () => window.clearTimeout(autoplayTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isAutoPlaying, isHovered, autoplaySpeed]);

  // Keyboard nav — only while the deck itself has focus-within, so it doesn't
  // hijack arrow keys used to scroll the rest of the page.
  useEffect(() => {
    const root = carouselRef.current;
    if (!root) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!root.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) (diff > 0 ? goToNext : goToPrev)();
  };

  const getCardStyle = (index: number) => {
    const isActive = index === activeIndex;
    const distance = (index - activeIndex + N) % N;
    const adjusted = distance > N / 2 ? distance - N : distance;
    const ad = Math.abs(adjusted);

    let rotateY = 0;
    let rotateX = 0;
    let translateZ = 0;
    if (isActive && isHovered) {
      rotateY = -mousePosition.x * maxRotation;
      rotateX = mousePosition.y * (maxRotation * 0.5);
      translateZ = 40;
    }

    return {
      x: adjusted * (cardWidth + gap),
      scale: isActive ? 1 : 0.86 - Math.min(ad, 2) * 0.05,
      zIndex: N - ad,
      opacity: 1 - Math.min(ad * 0.28, 0.72),
      rotateY,
      rotateX,
      translateZ,
    };
  };

  if (N === 0) return null;

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={carouselRef}
        className="relative mx-auto w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Project deck"
        style={{ perspective: `${perspective}px`, height: `${cardHeight}px` }}
      >
        <div className="relative flex h-full items-center justify-center">
          {cards.map((card, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.div
                key={card.id}
                className="absolute rounded-2xl"
                initial={false}
                animate={getCardStyle(index)}
                transition={{ type: "spring", stiffness: 300, damping: 32, mass: 1 }}
                onClick={() => goToIndex(index)}
                style={{ width: cardWidth, height: cardHeight, cursor: isActive ? "default" : "pointer" }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${N}: ${card.title}`}
                aria-hidden={!isActive}
              >
                <CardFace card={card} isActive={isActive} isHovered={isHovered} mouse={mousePosition} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* controls */}
      <div dir="ltr" className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous project"
          data-cursor-hover
          className="grid h-10 w-10 place-items-center rounded-full border border-bone/15 text-bone transition-colors hover:border-bone/40"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              onClick={() => goToIndex(i)}
              aria-label={`Go to ${card.title}`}
              aria-current={i === activeIndex}
              data-cursor-hover
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 22 : 6,
                background: i === activeIndex ? card.accent : "rgba(242,236,225,0.22)",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          aria-label="Next project"
          data-cursor-hover
          className="grid h-10 w-10 place-items-center rounded-full border border-bone/15 text-bone transition-colors hover:border-bone/40"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => setIsAutoPlaying((v) => !v)}
          aria-label={isAutoPlaying ? "Pause autoplay" : "Start autoplay"}
          title={isAutoPlaying ? "Pause" : "Play"}
          data-cursor-hover
          className="grid h-10 w-10 place-items-center rounded-full border border-bone/15 text-bone/70 transition-colors hover:border-bone/40 hover:text-bone"
        >
          {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ card */

function CardFace({
  card,
  isActive,
  isHovered,
  mouse,
}: {
  card: CarouselCard;
  isActive: boolean;
  isHovered: boolean;
  mouse: { x: number; y: number };
}) {
  const live = isActive && isHovered;

  return (
    <div
      role="button"
      tabIndex={isActive ? 0 : -1}
      onClick={() => {
        if (!isActive) return;
        card.onAction?.();
      }}
      onKeyDown={(e) => {
        if (isActive && (e.key === "Enter" || e.key === " ")) card.onAction?.();
      }}
      data-cursor-hover
      className={
        "group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-bone/12 bg-ink/90 shadow-2xl" +
        (card.featured ? " mpk-featured" : "")
      }
      style={{ boxShadow: isActive && !card.featured ? `0 40px 90px -35px ${card.accent}66` : undefined }}
    >
      {/* background layer — the deepest plane, drifts opposite the cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 30% 0%, ${card.accent}22, transparent 60%)`,
        }}
        animate={{
          translateX: live ? -mouse.x * 8 : 0,
          translateY: live ? -mouse.y * 8 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      />

      {/* media layer */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-black">
        {card.imageUrl ? (
          <motion.img
            src={card.imageUrl}
            alt={card.title}
            loading="lazy"
            className="h-full w-full object-cover"
            animate={{ scale: live ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display text-6xl font-bold opacity-25"
            style={{ color: card.accent }}
          >
            {card.title.slice(0, 2).toUpperCase()}
          </div>
        )}
        {card.stat && (
          <span
            className="absolute bottom-3 start-3 rounded-md px-2 py-1 font-mono text-[10px] tracking-widest backdrop-blur-sm ltr"
            style={{ background: "rgba(8,7,6,0.72)", color: card.accent }}
          >
            {card.stat}
          </span>
        )}
        {card.featured && card.featuredLabel && (
          <FeaturedBadge label={card.featuredLabel} className="absolute top-3 start-3" />
        )}
      </div>

      {/* content layer — rides slightly toward the cursor, above the media */}
      <motion.div
        className="flex flex-1 flex-col p-5"
        animate={{
          translateX: live ? mouse.x * 6 : 0,
          translateY: live ? mouse.y * 6 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        <h3 className="text-lg font-bold text-bone sm:text-xl ltr">{card.title}</h3>
        {card.subtitle && <p className="mt-1 text-[13px] text-bone/60 ltr">{card.subtitle}</p>}
        <p className="mt-2.5 line-clamp-3 flex-1 text-[14px] leading-6 text-bone/85">{card.description}</p>

        {card.tags && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-bone/10 px-2.5 py-1 font-mono text-[10px] text-bone/85 ltr"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: card.accent }}>
          <span>{card.actionLabel}</span>
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </motion.div>

      {/* glass sheen — the highlight that tracks the cursor across glass */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: live ? 0.5 : 0,
          background: `linear-gradient(${135 + mouse.y * 40}deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0) 55%)`,
        }}
      />

      {/* border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border transition-colors duration-300"
        style={{ borderColor: isActive ? `${card.accent}55` : "transparent" }}
      />
    </div>
  );
}
