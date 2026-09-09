import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { LangProvider } from "./i18n/LangProvider";

// The browser restoring a mid-page scroll position on refresh fights with
// Lenis/ScrollTrigger booting fresh at the top — the instrument and the
// scroll-linked chapters glitch/jump against each other. Always land on the
// hero and let the visitor scroll down themselves.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>
);
