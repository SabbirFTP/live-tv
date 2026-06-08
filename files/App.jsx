import { useState, useEffect, useRef } from "react";
import { StreamProvider } from "./context/StreamContext";
import { ThemeProvider } from "./context/ThemeContext";
import { loadStreams, hasAcceptedDisclaimer, hasTgJoined } from "./script";
import { useToast } from "./hooks/useToast";

import ThemeToggle      from "./components/ThemeToggle";
import Header           from "./components/Header";
import DisclaimerModal  from "./components/DisclaimerModal";
import TelegramGate     from "./components/TelegramGate";
import PublicSources    from "./components/PublicSources";
import SingleStreamInput from "./components/SingleStreamInput";
import BulkInput        from "./components/BulkInput";
import VideoPlayer      from "./components/VideoPlayer";
import StatsBar         from "./components/StatsBar";
import StreamList       from "./components/StreamList";
import Toast            from "./components/Toast";
import DevCredit        from "./components/DevCredit";

/* ── Floating orbs decoration ─────────────────────────────────────────────── */
function Orbs() {
  return (
    <>
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      <div className="orb orb4" />
    </>
  );
}

/* ── Inner app (needs contexts) ───────────────────────────────────────────── */
function AppInner() {
  const { toast, showToast }   = useToast();
  const [currentStream, setCurrentStream] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showTgGate, setShowTgGate]         = useState(false);
  const resultsRef = useRef(null);

  /* Show disclaimer once */
  useEffect(() => {
    if (!hasAcceptedDisclaimer()) setShowDisclaimer(true);
  }, []);

  /* Show Telegram gate after disclaimer is dismissed */
  function handleDisclaimerClose() {
    setShowDisclaimer(false);
    if (!hasTgJoined()) setShowTgGate(true);
  }

  function handleTgUnlock() {
    setShowTgGate(false);
  }

  /* Scroll to results area when streams are loaded */
  function scrollToResults() {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <>
      <Orbs />
      <ThemeToggle />

      {showDisclaimer && <DisclaimerModal onClose={handleDisclaimerClose} />}
      {showTgGate     && <TelegramGate   onUnlock={handleTgUnlock}        />}

      <div
        className="main-wrap relative z-10"
        style={{ maxWidth: 740, margin: "0 auto", padding: "28px 16px 60px" }}
      >
        <Header />

        {/* ── Input card ──────────────────────────────────────────────────── */}
        <div
          className="glass-strong rounded-2xl p-5 mb-5 anim-slide-down"
          style={{ animationDelay: ".05s" }}
        >
          <SingleStreamInput
            onPlay={setCurrentStream}
            showToast={showToast}
          />
          <BulkInput
            showToast={showToast}
            onResultsReady={scrollToResults}
          />
        </div>

        {/* ── Public sources ────────────────────────────────────────────── */}
        <PublicSources
          showToast={showToast}
          onResultsReady={scrollToResults}
        />

        {/* ── Player (shown only when a stream is active) ───────────────── */}
        {currentStream && (
          <VideoPlayer
            stream={currentStream}
            onStop={() => setCurrentStream(null)}
          />
        )}

        {/* ── Results anchor ────────────────────────────────────────────── */}
        <div ref={resultsRef} />

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <StatsBar />

        {/* ── Stream list ───────────────────────────────────────────────── */}
        <StreamList
          onPlay={setCurrentStream}
          showToast={showToast}
        />

        <DevCredit />
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}

/* ── Root export ──────────────────────────────────────────────────────────── */
export default function App() {
  const [initialStreams] = useState(() => loadStreams());

  return (
    <ThemeProvider>
      <StreamProvider initialStreams={initialStreams}>
        <AppInner />
      </StreamProvider>
    </ThemeProvider>
  );
}
