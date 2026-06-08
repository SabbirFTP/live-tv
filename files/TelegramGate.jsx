import { useState } from "react";
import { setTgJoined } from "../script";

export default function TelegramGate({ onUnlock }) {
  const [countdown, setCountdown] = useState(null); // null | number
  const [canGo, setCanGo] = useState(false);
  const [note, setNote] = useState("Telegram চ্যানেলে যোগ দিন, তারপর চালিয়ে যান।");

  function handleJoin() {
    window.open("https://t.me/livetvprotel", "_blank", "noopener");
    let s = 3;
    setCanGo(false);
    setCountdown(s);
    setNote(`${s} সেকেন্ড অপেক্ষা করুন...`);

    const t = setInterval(() => {
      s--;
      if (s <= 0) {
        clearInterval(t);
        setCountdown(null);
        setCanGo(true);
        setNote("যুক্ত হয়েছেন? এবার চালিয়ে যান।");
      } else {
        setCountdown(s);
        setNote(`${s} সেকেন্ড অপেক্ষা করুন...`);
      }
    }, 1000);
  }

  function handleGo() {
    if (!canGo) return;
    setTgJoined();
    onUnlock();
  }

  return (
    <div
      id="tgg-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(15,23,42,.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div className="modal-card" style={{ textAlign: "center" }}>
        {/* Telegram Icon */}
        <div style={{ marginBottom: 16 }}>
          <svg
            viewBox="0 0 48 48"
            width="56"
            height="56"
            style={{ margin: "0 auto" }}
          >
            <circle cx="24" cy="24" r="24" fill="#2AABEE" />
            <path
              fill="#fff"
              d="M35.6 13.2l-4.5 21.3c-.3 1.4-1.2 1.8-2.5 1.1l-6.9-5.1-3.3 3.2c-.4.4-.7.7-1.4.7l.5-7 12.9-11.6c.6-.5-.1-.8-.9-.3L11.5 24.4l-6.7-2.1c-1.4-.4-1.5-1.4.3-2.1l24.9-9.6c1.2-.4 2.2.3 1.6 2.6z"
            />
          </svg>
        </div>

        <h2 className="font-extrabold text-xl gradient-text mb-2">
          Telegram-এ যোগ দিন
        </h2>
        <p className="text-gray-500 text-sm mb-5" style={{ lineHeight: 1.8 }}>
          Live TV Pro চালিয়ে যেতে আমাদের Telegram চ্যানেলে যোগ দিন।
          আপডেট, নতুন সোর্স ও সাপোর্ট পাবেন সেখানে।
        </p>

        <button
          id="tgg-join"
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
          onClick={handleJoin}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
          Telegram-এ Join করুন
        </button>

        <button
          id="tgg-go"
          className="btn-secondary"
          style={{ width: "100%", justifyContent: "center", opacity: canGo ? 1 : 0.5 }}
          disabled={!canGo}
          onClick={handleGo}
        >
          {countdown !== null ? `${countdown} সেকেন্ড...` : "চালিয়ে যান"}
        </button>

        <p id="tgg-note" className="text-xs text-gray-400 mt-3">
          {note}
        </p>
      </div>
    </div>
  );
}
