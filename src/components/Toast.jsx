export default function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div className="copy-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
