import { useEffect } from "react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  // prevent background scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="app-modal-overlay--center">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
      />

      {/* Modal */}
      <div className="app-modal-panel relative max-w-md rounded-xl">
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="border border-gray-300 rounded-md px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-black text-white rounded-md px-4 py-2 text-sm hover:opacity-90"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}