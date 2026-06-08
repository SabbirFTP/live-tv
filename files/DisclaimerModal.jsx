import { acceptDisclaimer } from "../script";

export default function DisclaimerModal({ onClose }) {
  function handleOk() {
    acceptDisclaimer();
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
          >
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="font-extrabold text-lg gradient-text">দ্রষ্টব্য / Disclaimer</h2>
        </div>

        <p
          className="text-gray-600 text-sm leading-relaxed mb-2"
          style={{ lineHeight: 1.9 }}
        >
          এই প্ল্যাটফর্মের সকল স্ট্রিম লিংক ও সোর্স ইন্টারনেটে{" "}
          <b>পাবলিকভাবে উপলব্ধ</b> জায়গা থেকে সংগ্রহ করা হয়েছে। আমরা কোনো
          কন্টেন্ট <b>হোস্ট, আপলোড বা মালিকানা দাবি করি না</b> — শুধু পাবলিক
          লিংকগুলো একত্র ও যাচাই করি।
        </p>
        <p
          className="text-gray-500 text-sm leading-relaxed mb-5"
          style={{ lineHeight: 1.9 }}
        >
          কোনো কন্টেন্ট/লিংকে আপত্তি থাকলে সংশ্লিষ্ট মূল সোর্সের সাথে যোগাযোগ
          করুন। এই টুল শুধু লিংক যাচাই ও ব্যবস্থাপনার সুবিধার্থে।
        </p>

        <button
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleOk}
        >
          আমি বুঝেছি
        </button>
      </div>
    </div>
  );
}
