import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      className="theme-toggle"
      title="Light / Dark"
      aria-label="Toggle theme"
      onClick={toggle}
    >
      {/* Moon icon — shown in light mode */}
      {!dark && (
        <svg width="19" height="19" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
      {/* Sun icon — shown in dark mode */}
      {dark && (
        <svg width="19" height="19" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
