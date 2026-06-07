export default function TelegramGate({ onComplete }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="glass p-6 rounded-xl2 text-center max-w-sm w-full">
        <h2 className="text-xl font-bold mb-3">
          Join Telegram Channel
        </h2>

        <a
          href="https://t.me/livetvprotel"
          target="_blank"
          className="btn btn-primary w-full mb-3"
        >
          Join Now
        </a>

        <button
          onClick={() => {
            localStorage.setItem("tvpro_tg_joined", "1");
            onComplete();
          }}
          className="btn btn-soft w-full"
        >
          Continue
        </button>
      </div>
    </div>
  );
}