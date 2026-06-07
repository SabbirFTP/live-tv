import { useState } from "react";

export default function BulkInput() {
  const [text, setText] = useState("");

  return (
    <div className="glass p-6 rounded-xl2">
      <label className="text-sm font-bold text-indigo-600">
        M3U / HTML Paste
      </label>

      <textarea
        rows={6}
        className="input mt-3"
        placeholder="Paste M3U content here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button className="btn btn-primary mt-4 w-full">
        Parse Streams
      </button>
    </div>
  );
}