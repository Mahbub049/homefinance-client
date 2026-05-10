import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import ConfirmModal from "../components/ui/ConfirmModal";
import api from "../services/api";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

function formatMoney(v) {
  const n = Number(v || 0);
  return `৳ ${n.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
}

function safeNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function percent(part, total) {
  const p = Number(part || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.min(100, Math.max(0, Math.round((p / t) * 100)));
}

function safeDate(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function priorityRank(value) {
  if (value === "high") return 1;
  if (value === "medium") return 2;
  return 3;
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />
      <div className="animate-pulse">
        <div className="mb-4 h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mb-4 h-8 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function StatCard({ title, value, hint, tone = "blue", icon }) {
  const toneMap = {
    blue: "from-sky-500/15 via-blue-500/10 to-indigo-500/15 text-blue-700 dark:text-blue-200",
    green:
      "from-emerald-500/15 via-green-500/10 to-teal-500/15 text-emerald-700 dark:text-emerald-200",
    amber:
      "from-amber-500/20 via-orange-500/10 to-yellow-500/15 text-amber-700 dark:text-amber-200",
    purple:
      "from-purple-500/15 via-fuchsia-500/10 to-pink-500/15 text-purple-700 dark:text-purple-200",
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/75">
      <div className={`absolute inset-0 bg-gradient-to-br ${toneMap[tone] || toneMap.blue}`} />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {title}
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {value}
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-xl shadow-sm dark:bg-slate-950/60">
            {icon}
          </div>
        </div>
        <div className="text-xs leading-5 text-slate-600 dark:text-slate-300">
          {hint}
        </div>
      </div>
    </div>
  );
}

const initialForm = {
  productName: "",
  category: "",
  brand: "",
  expectedPrice: "",
  productLink: "",
  notes: "",
  priority: "medium",
  ownershipType: "shared",
  personalForUserId: "",
  paymentMode: "undecided",
};

const initialFilters = {
  search: "",
  priority: "all",
  ownershipType: "all",
  paymentMode: "all",
  sortBy: "manual",
};

function badgeClass(type, value) {
  if (type === "priority") {
    if (value === "high") {
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
    }
    if (value === "medium") {
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    }
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }

  if (type === "ownership") {
    if (value === "personal") {
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200";
    }
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200";
  }

  if (type === "payment") {
    if (value === "emi") {
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200";
    }
    if (value === "cash") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    }
    if (value === "either") {
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    }
    return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
}

function statusPillClass(kind) {
  if (kind === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
  }
  if (kind === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
  }
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200";
}

function priorityDotClass(value) {
  if (value === "high") return "bg-rose-500";
  if (value === "medium") return "bg-amber-500";
  return "bg-emerald-500";
}

function paymentAccentClass(value) {
  if (value === "emi") return "from-orange-500 to-amber-400";
  if (value === "cash") return "from-emerald-500 to-teal-400";
  if (value === "either") return "from-sky-500 to-blue-400";
  return "from-slate-500 to-slate-400";
}

function DragHandle(props) {
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
      title="Drag to reorder"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"
        />
      </svg>
    </button>
  );
}

function ActionButton({ children, variant = "neutral", onClick, disabled = false }) {
  const styles = {
    neutral:
      "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border px-3.5 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500";
}

function PurchaseModal({
  open,
  onClose,
  form,
  formErr,
  saving,
  editingId,
  onChange,
  onSubmit,
  onReset,
  members,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const previewPrice = safeNumber(form.expectedPrice);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-white/60 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-[2rem]">
          <div className="relative overflow-hidden border-b border-white/40 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 px-5 py-5 text-white sm:px-6">
            <div className="absolute right-[-70px] top-[-80px] h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-[-90px] left-[30%] h-44 w-44 rounded-full bg-amber-300/20 blur-2xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {editingId ? "Update wishlist item" : "Create new purchase plan"}
                </div>
                <h3 className="mt-3 text-2xl font-black">
                  {editingId ? "Edit Planned Purchase" : "Add Planned Purchase"}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-white/80">
                  Add the product, priority, payment style, and ownership so the buying plan stays clear.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6">
            {formErr && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {formErr}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
                      🛍️
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">Product Details</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Basic information about the item</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <FieldLabel required>Product Name</FieldLabel>
                      <input
                        type="text"
                        name="productName"
                        value={form.productName}
                        onChange={onChange}
                        placeholder="e.g. Blender, Headphone, Rice Cooker"
                        className={inputClass()}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Category</FieldLabel>
                        <input
                          type="text"
                          name="category"
                          value={form.category}
                          onChange={onChange}
                          placeholder="e.g. Appliance"
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <FieldLabel>Brand</FieldLabel>
                        <input
                          type="text"
                          name="brand"
                          value={form.brand}
                          onChange={onChange}
                          placeholder="e.g. Philips"
                          className={inputClass()}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Expected Price</FieldLabel>
                        <input
                          type="number"
                          min="0"
                          name="expectedPrice"
                          value={form.expectedPrice}
                          onChange={onChange}
                          placeholder="e.g. 7000"
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <FieldLabel>Product Link</FieldLabel>
                        <input
                          type="text"
                          name="productLink"
                          value={form.productLink}
                          onChange={onChange}
                          placeholder="Optional URL"
                          className={inputClass()}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-200">
                      ⚙️
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">Planning Rules</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Priority, ownership and payment preference</div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <FieldLabel>Priority</FieldLabel>
                      <select
                        name="priority"
                        value={form.priority}
                        onChange={onChange}
                        className={inputClass()}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Ownership</FieldLabel>
                      <select
                        name="ownershipType"
                        value={form.ownershipType}
                        onChange={onChange}
                        className={inputClass()}
                      >
                        <option value="shared">Shared</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Payment</FieldLabel>
                      <select
                        name="paymentMode"
                        value={form.paymentMode}
                        onChange={onChange}
                        className={inputClass()}
                      >
                        <option value="undecided">Undecided</option>
                        <option value="cash">Cash</option>
                        <option value="emi">EMI</option>
                        <option value="either">Either</option>
                      </select>
                    </div>
                  </div>

                  {form.ownershipType === "personal" && (
                    <div className="mt-4">
                      <FieldLabel required>Personal For</FieldLabel>
                      <select
                        name="personalForUserId"
                        value={form.personalForUserId}
                        onChange={onChange}
                        className={inputClass()}
                      >
                        <option value="">Select family member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mt-4">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      rows="5"
                      name="notes"
                      value={form.notes}
                      onChange={onChange}
                      placeholder="Optional details, color, model preference, timing, etc."
                      className={`${inputClass()} resize-none`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-5 shadow-sm dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-slate-900 dark:to-fuchsia-500/10">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Preview
                  </div>
                  <div className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                    {form.productName || "Product name"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {[form.brand, form.category].filter(Boolean).join(" • ") || "Brand and category will show here"}
                  </div>

                  <div className="mt-5 rounded-3xl bg-white/80 p-4 dark:bg-slate-950/60">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Estimated Budget</div>
                    <div className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
                      {formatMoney(previewPrice)}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass("priority", form.priority)}`}>
                      {form.priority}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass("ownership", form.ownershipType)}`}>
                      {form.ownershipType}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass("payment", form.paymentMode)}`}>
                      {form.paymentMode}
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                  <div className="font-bold text-slate-950 dark:text-white">Planning Tip</div>
                  <p className="mt-2 leading-6">
                    Keep high-priority items at the top. Use EMI only for large purchases that will not disturb monthly essentials.
                  </p>
                </div>
              </div>
            </div>
          </form>

          <div className="border-t border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  onClose();
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onSubmit}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Saving..."
                  : editingId
                  ? "Update Purchase"
                  : "Save Purchase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/50">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-100">
        {value || "—"}
      </div>
    </div>
  );
}

function SortablePlannedItem({
  item,
  personalName,
  onEdit,
  onMarkBought,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur transition duration-300 dark:border-white/10 dark:bg-slate-900/75 md:p-5 ${
        isDragging ? "scale-[0.99] shadow-2xl opacity-90" : "hover:-translate-y-0.5 hover:shadow-xl"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${paymentAccentClass(item.paymentMode)}`} />
      <div className="absolute right-[-80px] top-[-80px] h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl transition group-hover:bg-fuchsia-500/10" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="pt-1">
            <DragHandle {...attributes} {...listeners} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${priorityDotClass(item.priority)}`} />
              <h4 className="break-words text-lg font-black text-slate-950 dark:text-white">
                {item.productName}
              </h4>

              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass("priority", item.priority)}`}>
                {item.priority}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass("ownership", item.ownershipType)}`}>
                {item.ownershipType}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass("payment", item.paymentMode)}`}>
                {item.paymentMode}
              </span>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <InfoChip label="Brand" value={item.brand || "—"} />
              <InfoChip label="Category" value={item.category || "—"} />
              {item.ownershipType === "personal" && (
                <InfoChip label="Personal For" value={personalName || "Unknown"} />
              )}
              <InfoChip label="Estimated Cost" value={formatMoney(item.expectedPrice || 0)} />
            </div>

            {item.notes ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Note:</span> {item.notes}
              </div>
            ) : null}

            {item.productLink ? (
              <div className="pt-3">
                <a
                  href={item.productLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 break-all text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  View Product Link →
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div className="xl:min-w-[230px]">
          <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 xl:text-right">
            Added {safeDate(item.createdAt)}
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <ActionButton variant="neutral" onClick={() => onEdit(item)}>
              Edit
            </ActionButton>
            <ActionButton variant="success" onClick={() => onMarkBought(item._id)}>
              Mark Bought
            </ActionButton>
            <ActionButton variant="danger" onClick={() => onDelete(item._id)}>
              Delete
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoughtHistoryItem({ item, personalName, onMoveBack, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-emerald-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-500/10 md:p-5">
      <div className="absolute right-[-90px] top-[-90px] h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h4 className="break-words text-lg font-black text-slate-950 dark:text-white">
              {item.productName}
            </h4>

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              bought
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass("ownership", item.ownershipType)}`}>
              {item.ownershipType}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${badgeClass("payment", item.paymentMode)}`}>
              {item.paymentMode}
            </span>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <InfoChip label="Brand" value={item.brand || "—"} />
            <InfoChip label="Category" value={item.category || "—"} />
            {item.ownershipType === "personal" && (
              <InfoChip label="Personal For" value={personalName || "Unknown"} />
            )}
            <InfoChip label="Planned Cost" value={formatMoney(item.expectedPrice || 0)} />
          </div>

          {item.notes ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Note:</span> {item.notes}
            </div>
          ) : null}
        </div>

        <div className="xl:min-w-[230px]">
          <div className="mb-3 rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 xl:text-right">
            Updated {safeDate(item.updatedAt)}
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <ActionButton variant="neutral" onClick={() => onMoveBack(item._id)}>
              Move Back
            </ActionButton>
            <ActionButton variant="danger" onClick={() => onDelete(item._id)}>
              Delete
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total, barClass, right }) {
  const width = percent(value, total);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{right || formatMoney(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-3xl dark:from-indigo-500/10 dark:to-fuchsia-500/10">
        🧺
      </div>
      <div className="mb-2 text-lg font-black text-slate-950 dark:text-white">{title}</div>
      <div className="mx-auto max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default function PlannedPurchases() {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState(initialForm);
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filters, setFilters] = useState(initialFilters);
  const [reordering, setReordering] = useState(false);

  const [activeTab, setActiveTab] = useState("active");
  const [modalOpen, setModalOpen] = useState(false);

  const [notice, setNotice] = useState({ type: "", text: "" });

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!notice.text) return;
    const t = setTimeout(() => {
      setNotice({ type: "", text: "" });
    }, 3000);
    return () => clearTimeout(t);
  }, [notice]);

  function showNotice(type, text) {
    setNotice({ type, text });
  }

  function openConfirm(title, message, onConfirm) {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
    });
  }

  function closeConfirm() {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  }

  async function loadInitialData() {
    await Promise.all([loadItems(), loadMembers()]);
  }

  async function loadItems() {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/api/planned-purchases");
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      setItems([]);
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load planned purchases"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const res = await api.get("/api/family/members");
      setMembers(Array.isArray(res.data?.members) ? res.data.members : []);
    } catch {
      setMembers([]);
    }
  }

  const memberMap = useMemo(() => {
    const map = {};
    for (const member of members) {
      map[member.id] = member.name;
    }
    return map;
  }, [members]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "ownershipType" && value !== "personal") {
        next.personalForUserId = "";
      }

      return next;
    });
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setFormErr("");
  }

  function openAddModal() {
    resetForm();
    setModalOpen(true);
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      productName: item.productName || "",
      category: item.category || "",
      brand: item.brand || "",
      expectedPrice:
        item.expectedPrice === 0 || item.expectedPrice
          ? String(item.expectedPrice)
          : "",
      productLink: item.productLink || "",
      notes: item.notes || "",
      priority: item.priority || "medium",
      ownershipType: item.ownershipType || "shared",
      personalForUserId: item.personalForUserId || "",
      paymentMode: item.paymentMode || "undecided",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();

    if (!form.productName.trim()) {
      setFormErr("Product name is required");
      return;
    }

    if (form.expectedPrice !== "" && Number(form.expectedPrice) < 0) {
      setFormErr("Expected price cannot be negative");
      return;
    }

    if (form.ownershipType === "personal" && !form.personalForUserId) {
      setFormErr("Please select who this personal purchase is for");
      return;
    }

    try {
      setSaving(true);
      setFormErr("");

      const payload = {
        productName: form.productName.trim(),
        category: form.category.trim(),
        brand: form.brand.trim(),
        expectedPrice:
          form.expectedPrice === "" ? 0 : Number(form.expectedPrice),
        productLink: form.productLink.trim(),
        notes: form.notes.trim(),
        priority: form.priority,
        ownershipType: form.ownershipType,
        personalForUserId:
          form.ownershipType === "personal" ? form.personalForUserId : null,
        paymentMode: form.paymentMode,
        status: "planned",
      };

      if (editingId) {
        await api.put(`/api/planned-purchases/${editingId}`, payload);
        showNotice("success", "Planned purchase updated successfully.");
      } else {
        await api.post("/api/planned-purchases", payload);
        showNotice("success", "Planned purchase added successfully.");
      }

      resetForm();
      setModalOpen(false);
      await loadItems();
    } catch (e) {
      setFormErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to save planned purchase"
      );
    } finally {
      setSaving(false);
    }
  }

  async function performDelete(id) {
    try {
      await api.delete(`/api/planned-purchases/${id}`);
      if (editingId === id) {
        resetForm();
        setModalOpen(false);
      }
      await loadItems();
      showNotice("success", "Planned purchase deleted successfully.");
    } catch (e) {
      showNotice(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "Failed to delete planned purchase"
      );
    }
  }

  function handleDelete(id) {
    openConfirm(
      "Delete Planned Item",
      "Are you sure you want to delete this planned item?",
      async () => {
        closeConfirm();
        await performDelete(id);
      }
    );
  }

  async function performMarkBought(id) {
    try {
      await api.patch(`/api/planned-purchases/${id}/mark-bought`);
      if (editingId === id) {
        resetForm();
        setModalOpen(false);
      }
      await loadItems();
      showNotice("success", "Item marked as bought.");
    } catch (e) {
      showNotice(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "Failed to mark item as bought"
      );
    }
  }

  function handleMarkBought(id) {
    openConfirm(
      "Mark as Bought",
      "This item will be moved to bought history. Do you want to continue?",
      async () => {
        closeConfirm();
        await performMarkBought(id);
      }
    );
  }

  async function performMoveBackToPlanned(id) {
    try {
      await api.patch(`/api/planned-purchases/${id}/mark-planned`);
      await loadItems();
      showNotice("success", "Item moved back to active planned list.");
    } catch (e) {
      showNotice(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "Failed to move item back"
      );
    }
  }

  function handleMoveBackToPlanned(id) {
    openConfirm(
      "Move Back to Active Plans",
      "Do you want to move this item back to the active planned purchases list?",
      async () => {
        closeConfirm();
        await performMoveBackToPlanned(id);
      }
    );
  }

  const activeItems = useMemo(
    () =>
      items
        .filter((item) => item.status === "planned")
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [items]
  );

  const boughtItems = useMemo(
    () =>
      items
        .filter((item) => item.status === "bought")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [items]
  );

  const filteredActiveItems = useMemo(() => {
    let list = [...activeItems];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((item) => {
        const personalName =
          item.ownershipType === "personal"
            ? memberMap[item.personalForUserId] || ""
            : "";

        return (
          item.productName?.toLowerCase().includes(q) ||
          item.brand?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q) ||
          personalName.toLowerCase().includes(q)
        );
      });
    }

    if (filters.priority !== "all") {
      list = list.filter((item) => item.priority === filters.priority);
    }

    if (filters.ownershipType !== "all") {
      list = list.filter((item) => item.ownershipType === filters.ownershipType);
    }

    if (filters.paymentMode !== "all") {
      list = list.filter((item) => item.paymentMode === filters.paymentMode);
    }

    if (filters.sortBy === "latest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === "price-high") {
      list.sort(
        (a, b) => Number(b.expectedPrice || 0) - Number(a.expectedPrice || 0)
      );
    } else if (filters.sortBy === "price-low") {
      list.sort(
        (a, b) => Number(a.expectedPrice || 0) - Number(b.expectedPrice || 0)
      );
    } else if (filters.sortBy === "priority") {
      list.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
    } else {
      list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    return list;
  }, [activeItems, filters, memberMap]);

  const summary = useMemo(() => {
    const estimatedTotal = activeItems.reduce(
      (sum, item) => sum + Number(item.expectedPrice || 0),
      0
    );

    const boughtTotal = boughtItems.reduce(
      (sum, item) => sum + Number(item.expectedPrice || 0),
      0
    );

    const highPriorityCount = activeItems.filter((item) => item.priority === "high").length;
    const sharedCount = activeItems.filter((item) => item.ownershipType === "shared").length;
    const personalCount = activeItems.filter((item) => item.ownershipType === "personal").length;

    const priorityBudget = {
      high: activeItems
        .filter((item) => item.priority === "high")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
      medium: activeItems
        .filter((item) => item.priority === "medium")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
      low: activeItems
        .filter((item) => item.priority === "low")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
    };

    const paymentBudget = {
      cash: activeItems
        .filter((item) => item.paymentMode === "cash")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
      emi: activeItems
        .filter((item) => item.paymentMode === "emi")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
      either: activeItems
        .filter((item) => item.paymentMode === "either")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
      undecided: activeItems
        .filter((item) => item.paymentMode === "undecided")
        .reduce((sum, item) => sum + Number(item.expectedPrice || 0), 0),
    };

    return {
      activeCount: activeItems.length,
      boughtCount: boughtItems.length,
      estimatedTotal,
      boughtTotal,
      highPriorityCount,
      sharedCount,
      personalCount,
      priorityBudget,
      paymentBudget,
    };
  }, [activeItems, boughtItems]);

  const filterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count += 1;
    if (filters.priority !== "all") count += 1;
    if (filters.ownershipType !== "all") count += 1;
    if (filters.paymentMode !== "all") count += 1;
    if (filters.sortBy !== "manual") count += 1;
    return count;
  }, [filters]);

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (
      filters.search ||
      filters.priority !== "all" ||
      filters.ownershipType !== "all" ||
      filters.paymentMode !== "all" ||
      filters.sortBy !== "manual"
    ) {
      showNotice(
        "error",
        "Drag reorder works only in Manual sort without active filters."
      );
      return;
    }

    const oldIndex = activeItems.findIndex((item) => item._id === active.id);
    const newIndex = activeItems.findIndex((item) => item._id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activeItems, oldIndex, newIndex);

    const updatedItems = items.map((item) => {
      if (item.status !== "planned") return item;
      const indexInReordered = reordered.findIndex((x) => x._id === item._id);
      if (indexInReordered === -1) return item;
      return { ...item, sortOrder: indexInReordered + 1 };
    });

    setItems(updatedItems);

    try {
      setReordering(true);
      await api.patch("/api/planned-purchases/reorder", {
        orderedIds: reordered.map((item) => item._id),
      });
      showNotice("info", "Planned item order updated.");
    } catch (e) {
      await loadItems();
      showNotice(
        "error",
        e?.response?.data?.message ||
          e?.message ||
          "Failed to reorder planned purchases"
      );
    } finally {
      setReordering(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl px-2 pb-10 sm:px-4">
        <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-xl shadow-indigo-500/20 dark:border-white/10 sm:p-6 lg:p-7">
          <div className="absolute right-[-80px] top-[-100px] h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[20%] h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur">
                Purchase Planner
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Planned Purchases
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Organize future products, compare priorities, estimate required budget, and keep bought items in a clean history.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[380px]">
              <button
                onClick={loadInitialData}
                disabled={loading}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={openAddModal}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                + Add Purchase
              </button>
            </div>
          </div>
        </section>

        {notice.text ? (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-bold ${statusPillClass(notice.type)}`}>
            {notice.text}
          </div>
        ) : null}

        {err && (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <div className="mb-1 font-black">Couldn’t load planned items</div>
            <div className="text-sm break-words">{err}</div>
          </div>
        )}

        {loading ? (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard
              title="Active Plans"
              value={summary.activeCount}
              hint="Items waiting to be bought"
              tone="blue"
              icon="🧾"
            />
            <StatCard
              title="Bought Items"
              value={summary.boughtCount}
              hint={`Completed plan value: ${formatMoney(summary.boughtTotal)}`}
              tone="green"
              icon="✅"
            />
            <StatCard
              title="Estimated Budget"
              value={formatMoney(summary.estimatedTotal)}
              hint={`${summary.highPriorityCount} high-priority item(s) in active list`}
              tone="purple"
              icon="🎯"
            />
          </div>
        )}

        {!loading && (
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75 lg:col-span-2">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Priority & Payment Graph</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Budget distribution from active planned items.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Active only
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Priority Budget</div>
                  <ProgressRow label="High" value={summary.priorityBudget.high} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-rose-500 to-pink-400" />
                  <ProgressRow label="Medium" value={summary.priorityBudget.medium} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-amber-500 to-yellow-400" />
                  <ProgressRow label="Low" value={summary.priorityBudget.low} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Payment Budget</div>
                  <ProgressRow label="Cash" value={summary.paymentBudget.cash} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-emerald-500 to-teal-400" />
                  <ProgressRow label="EMI" value={summary.paymentBudget.emi} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-orange-500 to-amber-400" />
                  <ProgressRow label="Either" value={summary.paymentBudget.either} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-sky-500 to-blue-400" />
                  <ProgressRow label="Undecided" value={summary.paymentBudget.undecided} total={summary.estimatedTotal} barClass="bg-gradient-to-r from-slate-500 to-slate-400" />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Plan Snapshot</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ownership and readiness indicators.</p>

              <div className="mt-5 space-y-4">
                <ProgressRow
                  label="Shared Items"
                  value={summary.sharedCount}
                  total={Math.max(summary.activeCount, 1)}
                  right={`${summary.sharedCount} item(s)`}
                  barClass="bg-gradient-to-r from-blue-500 to-indigo-400"
                />
                <ProgressRow
                  label="Personal Items"
                  value={summary.personalCount}
                  total={Math.max(summary.activeCount, 1)}
                  right={`${summary.personalCount} item(s)`}
                  barClass="bg-gradient-to-r from-purple-500 to-fuchsia-400"
                />
                <ProgressRow
                  label="High Priority"
                  value={summary.highPriorityCount}
                  total={Math.max(summary.activeCount, 1)}
                  right={`${summary.highPriorityCount} item(s)`}
                  barClass="bg-gradient-to-r from-rose-500 to-pink-400"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex w-full rounded-3xl border border-white/70 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-black transition sm:flex-none ${
              activeTab === "active"
                ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Active Plans
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-black transition sm:flex-none ${
              activeTab === "history"
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            Bought History
          </button>
        </div>

        {activeTab === "active" ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75 md:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Search, Filter & Sort</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Drag reorder works only when sort is Manual and all filters are cleared.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFilters(initialFilters)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Clear Filters {filterCount ? `(${filterCount})` : ""}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="xl:col-span-2">
                  <FieldLabel>Search</FieldLabel>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search by name, brand, category, note, person"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <FieldLabel>Priority</FieldLabel>
                  <select name="priority" value={filters.priority} onChange={handleFilterChange} className={inputClass()}>
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Ownership</FieldLabel>
                  <select name="ownershipType" value={filters.ownershipType} onChange={handleFilterChange} className={inputClass()}>
                    <option value="all">All</option>
                    <option value="shared">Shared</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Payment</FieldLabel>
                  <select name="paymentMode" value={filters.paymentMode} onChange={handleFilterChange} className={inputClass()}>
                    <option value="all">All</option>
                    <option value="undecided">Undecided</option>
                    <option value="cash">Cash</option>
                    <option value="emi">EMI</option>
                    <option value="either">Either</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Sort By</FieldLabel>
                  <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className={inputClass()}>
                    <option value="manual">Manual Order</option>
                    <option value="latest">Latest Added</option>
                    <option value="price-high">Price High to Low</option>
                    <option value="price-low">Price Low to High</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75 md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Active Planned Items</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Organize by drag and drop when using manual order.
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {reordering ? "Saving order..." : `${filteredActiveItems.length} shown`}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                  <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                </div>
              ) : filteredActiveItems.length === 0 ? (
                <EmptyState
                  title="No matching active planned purchases"
                  text="Try changing search, filters, or add a new item to your purchase plan."
                  action={
                    <button
                      onClick={openAddModal}
                      className="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
                    >
                      Add Purchase
                    </button>
                  }
                />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredActiveItems.map((item) => item._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {filteredActiveItems.map((item) => (
                        <SortablePlannedItem
                          key={item._id}
                          item={item}
                          personalName={
                            item.ownershipType === "personal"
                              ? memberMap[item.personalForUserId]
                              : ""
                          }
                          onEdit={startEdit}
                          onMarkBought={handleMarkBought}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/75 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Bought History</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Completed items are kept here instead of being removed.
                </p>
              </div>

              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                {boughtItems.length} bought
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
              </div>
            ) : boughtItems.length === 0 ? (
              <EmptyState
                title="No bought items yet"
                text="When you mark an active item as bought, it will appear here as a clean purchase history."
              />
            ) : (
              <div className="space-y-4">
                {boughtItems.map((item) => (
                  <BoughtHistoryItem
                    key={item._id}
                    item={item}
                    personalName={
                      item.ownershipType === "personal"
                        ? memberMap[item.personalForUserId]
                        : ""
                    }
                    onMoveBack={handleMoveBackToPlanned}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <PurchaseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        form={form}
        formErr={formErr}
        saving={saving}
        editingId={editingId}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={resetForm}
        members={members}
      />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={closeConfirm}
        onConfirm={confirmState.onConfirm || closeConfirm}
      />
    </AppLayout>
  );
}
