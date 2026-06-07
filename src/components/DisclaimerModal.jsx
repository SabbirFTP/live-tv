export default function DisclaimerModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="glass p-6 rounded-xl2 max-w-md text-center">
        <h2 className="text-lg font-bold mb-2">Disclaimer</h2>

        <p className="text-sm text-gray-600 mb-4">
          Streams are publicly available. We do not host content.
        </p>

        <button onClick={onClose} className="btn btn-primary">
          I Understand
        </button>
      </div>
    </div>
  );
}