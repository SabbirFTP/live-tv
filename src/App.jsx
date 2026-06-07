import { useState } from "react";
import Header from "./components/Header";
import PlayerSection from "./components/PlayerSection";
import BulkInput from "./components/BulkInput";
import DisclaimerModal from "./components/DisclaimerModal";
import TelegramGate from "./components/TelegramGate";

export default function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [tgJoined, setTgJoined] = useState(
    localStorage.getItem("tvpro_tg_joined") === "1"
  );

  return (
    <div className="min-h-screen">
      {!tgJoined && <TelegramGate onComplete={() => setTgJoined(true)} />}

      {showDisclaimer && (
        <DisclaimerModal onClose={() => setShowDisclaimer(false)} />
      )}

      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <PlayerSection />
        <BulkInput />
      </div>
    </div>
  );
}