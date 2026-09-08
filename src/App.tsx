import { useState } from "react";
import Preloader from "./components/Preloader";
import CustomCursor from "./components/CustomCursor";
import ParticleCanvas from "./components/ParticleCanvas";
import Navbar from "./components/Navbar";
import SectionRail from "./components/SectionRail";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import AboutStage from "./components/AboutStage";
import VisionRail from "./components/VisionRail";
import DataConsole from "./components/DataConsole";
import WebStack from "./components/WebStack";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { useSmoothScroll } from "./scroll/useSmoothScroll";

export default function App() {
  const [loading, setLoading] = useState(true);
  useSmoothScroll(!loading);

  return (
    <div className="grain relative min-h-screen bg-ink text-bone">
      <Preloader onDone={() => setLoading(false)} />

      <div className="grid-bg pointer-events-none fixed inset-0 -z-10" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(53,224,255,0.10),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,6,10,0.9)_100%)]" />

      <ParticleCanvas active={!loading} />
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
        <VisionRail />
        <DataConsole />
        <WebStack />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
