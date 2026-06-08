export default function DevCredit() {
  return (
    <div className="dev-credit">
      <p className="dev-label">Developed by</p>
      <p className="dev-name gradient-text">Monjil Hossain</p>

      <a
        href="https://github.com/Monjil404"
        target="_blank"
        rel="noopener noreferrer"
        className="dev-photo"
        title="Visit GitHub"
      >
        <img
          src="https://avatars.githubusercontent.com/Monjil404"
          alt="Monjil Hossain"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='24' r='14' fill='%23c7d2fe'/%3E%3Cellipse cx='32' cy='56' rx='24' ry='16' fill='%23e0e7ff'/%3E%3C/svg%3E";
          }}
        />
      </a>

      <div className="mt-4 flex justify-center gap-3 flex-wrap">
        {/* GitHub */}
        <a
          href="https://github.com/Monjil404"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          style={{ padding: "7px 14px", fontSize: 12, textDecoration: "none" }}
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.72.5.09.68-.22.68-.49v-1.71c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0112 7.44c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.71 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49C19.13 20.63 22 16.79 22 12.26 22 6.58 17.52 2 12 2z" />
          </svg>
          GitHub
        </a>

        {/* Telegram */}
        <a
          href="https://t.me/livetvprotel"
          target="_blank"
          rel="noopener noreferrer"
          className="tg-join-badge"
          style={{ marginTop: 0 }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
          Telegram Channel
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-5" style={{ opacity: 0.5 }}>
        © 2025 Live TV Pro · For educational use only
      </p>
    </div>
  );
}
