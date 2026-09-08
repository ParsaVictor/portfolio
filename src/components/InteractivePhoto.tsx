import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useLang } from "../i18n/LangProvider";

const STRIPS = 12;

export default function InteractivePhoto({ src }: { src: string }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const springX = useSpring(mx, { stiffness: 140, damping: 18, mass: 0.4 });
  const springY = useSpring(my, { stiffness: 140, damping: 18, mass: 0.4 });

  const rotateX = useTransform(springY, [0, 1], [10, -10]);
  const rotateY = useTransform(springX, [0, 1], [-10, 10]);
  const glowX = useTransform(springX, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(springY, [0, 1], ["0%", "100%"]);
  const spotlight = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      `radial-gradient(220px circle at ${gx} ${gy}, rgba(53,224,255,0.28), transparent 70%)`
  );

  function handleMove(e: React.MouseEvent) {
    const rect = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }
  function handleLeave() {
    mx.set(0.5);
    my.set(0.5);
    setHover(false);
  }

  return (
    <div className="relative mx-auto w-full max-w-[400px] select-none" style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={handleLeave}
        animate={hover ? {} : { y: [0, -6, 0] }}
        transition={hover ? {} : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative aspect-[4/5] w-full overflow-hidden rounded-[1.8rem] border border-bone/10 bg-black shadow-[0_0_80px_-12px_rgba(53,224,255,0.35)]"
      >
        <div className="absolute inset-0">
          {Array.from({ length: STRIPS }).map((_, i) => (
            <Strip key={i} index={i} total={STRIPS} src={src} mx={springX} my={springY} hover={hover} />
          ))}
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 bg-cover bg-center mix-blend-screen"
          style={{
            backgroundImage: `url(${src})`,
            opacity: hover ? 0.5 : 0,
            x: useTransform(springX, [0, 1], [-9, 9]),
            filter: "url(#redshift)",
          }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-cover bg-center mix-blend-screen"
          style={{
            backgroundImage: `url(${src})`,
            opacity: hover ? 0.5 : 0,
            x: useTransform(springX, [0, 1], [9, -9]),
            filter: "url(#cyanshift)",
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0,transparent_calc(100%-1px),rgba(53,224,255,0.25)_100%)] bg-[length:100%_9px] opacity-0 transition-opacity duration-500 group-hover:opacity-60" />
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: spotlight }}
        />

        <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] ring-1 ring-inset ring-bone/10" />

        <Corner className="start-3 top-3 border-s-2 border-t-2" />
        <Corner className="end-3 top-3 border-e-2 border-t-2" />
        <Corner className="bottom-3 start-3 border-b-2 border-s-2" />
        <Corner className="bottom-3 end-3 border-b-2 border-e-2" />

        <span className="absolute end-3 top-3 rounded-full border border-cyanx/50 bg-black/50 px-2 py-0.5 font-mono text-[9px] tracking-widest text-cyanx backdrop-blur sm:end-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px] ltr">
          {t.hero.photoTag}
        </span>
      </motion.div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-widest text-dim ltr">
        <span>{t.hero.photoMeta}</span>
        <span className="text-cyanx/80">ISFAHAN · IR</span>
      </div>

      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="redshift">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="cyanshift">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={`pointer-events-none absolute h-5 w-5 border-cyanx/80 ${className}`} />;
}

function Strip({
  index,
  total,
  src,
  mx,
  my,
  hover,
}: {
  index: number;
  total: number;
  src: string;
  mx: import("framer-motion").MotionValue<number>;
  my: import("framer-motion").MotionValue<number>;
  hover: boolean;
}) {
  const stripPct = 100 / total;
  const center = (index + 0.5) / total;
  const dist = useTransform(my, (v) => Math.abs(v - center));
  const shiftBase = useTransform(mx, (v) => (v - 0.5) * 2);
  const shift = useTransform([shiftBase, dist], ([sb, d]: number[]) => {
    const falloff = Math.max(0, 1 - d * 3.2);
    const dir = index % 2 === 0 ? 1 : -1;
    return sb * falloff * 16 * dir;
  });

  return (
    <motion.div
      className="absolute start-0 w-full overflow-hidden"
      style={{
        top: `${index * stripPct}%`,
        // +1px so rounding can never open a hairline seam between slices
        height: `calc(${stripPct}% + 1px)`,
        x: hover ? shift : 0,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute start-0 w-full max-w-none object-cover"
        style={{ top: `-${index * 100}%`, height: `${total * 100}%` }}
      />
    </motion.div>
  );
}
