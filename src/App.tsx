import { useState } from "react";
import Preloader from "./components/Preloader";
import CustomCursor from "./components/CustomCursor";
import ParticleCanvas from "./components/ParticleCanvas";
import Navbar from "./components/Navbar";
import SectionRail from "./components/SectionRail";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import ChapterBreak from "./components/ChapterBreak";
import ChapterVeil from "./components/ChapterVeil";
import AboutStage from "./components/AboutStage";
import VisionRail from "./components/VisionRail";
import DataConsole from "./components/DataConsole";
import WebStack from "./components/WebStack";
import Contact from "./components/Contact";
import ProjectModal from "./components/ProjectModal";
import Footer from "./components/Footer";
import { useSmoothScroll } from "./scroll/useSmoothScroll";
import { useLang } from "./i18n/LangProvider";
import { STAGE_COLORS } from "./config";

export default function App() {
  const [loading, setLoading] = useState(true);
  const { t } = useLang();
  useSmoothScroll(!loading);

  return (
    <div className="grain relative min-h-screen bg-ink text-bone">
      <Preloader onDone={() => setLoading(false)} />

      <div className="grid-bg pointer-events-none fixed inset-0 -z-10" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(53,224,255,0.09),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_12%_88%,rgba(255,180,84,0.10),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_50%_45%_at_92%_20%,rgba(255,106,94,0.06),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(10,9,8,0.9)_100%)]" />

      <ParticleCanvas active={!loading} />
      {/* Scrim ABOVE the canvas: the vignette below it cannot dampen additive
          points, and without this the cloud competes with copy at the edges. */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_62%_58%_at_50%_50%,transparent_35%,rgba(10,9,8,0.72)_100%)]" />
      <CustomCursor />

      {!loading && (
        <>
          <Navbar />
          <SectionRail />
        </>
      )}

      <main className="relative z-10">
        <Hero />
        <Marquee />
        <AboutStage />
        <ChapterBreak index={t.cv.index} label={t.cv.kicker} accent={STAGE_COLORS.cv} />
        <VisionRail />
        <ChapterBreak index={t.data.index} label={t.data.kicker} accent={STAGE_COLORS.data} />
        <DataConsole />
        <ChapterBreak index={t.web.index} label={t.web.kicker} accent={STAGE_COLORS.web} />
        <WebStack />
        <ChapterBreak index="04" label={t.contact.kicker} accent={STAGE_COLORS.contact} />
        <Contact />
      </main>
      <Footer />
      {!loading && <ChapterVeil />}
      <ProjectModal />
    </div>
  );
}
