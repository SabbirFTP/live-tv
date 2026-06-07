import { useState } from "react";

export default function PlayerSection() {
  const [url, setUrl] = useState("");

  return (
    <div className="glass p-6 rounded-xl2 mb-6">
      <label className="text-sm font-bold text-indigo-600">
        Single Stream URL
      </label>

      <div className="flex gap-2 mt-3">
        <input
          className="input"
          placeholder="Enter M3U8 URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button className="btn btn-primary">Play</button>
        <button className="btn btn-soft">Check</button>
      </div>
    </div>
  );
}