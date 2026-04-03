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
  return `৳ ${n.toLocaleString()}`;
}

function SkeletonCard() {
  return (
    <div className="bg-white border rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-2 w-full bg-gray-200 rounded" />
    </div>
  );
}

function StatCard({ title, value, hint }) {
  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-xs text-gray-500">{hint}</div>
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
    if (value === "high") return "bg-red-50 text-red-700 border-red-200";
    if (value === "medium") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (type === "ownership") {
    if (value === "personal") return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (type === "payment") {
    if (value === "emi") return "bg-orange-50 text-orange-700 border-orange-200";
    if (value === "cash") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (value === "either") return "bg-sky-50 text-sky-700 border-sky-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  }

  return "bg-gray-50 text-gray-700 border-gray-200";
}

function statusPillClass(kind) {
  if (kind === "success") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (kind === "error") return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

function DragHandle(props) {
  return (
    <button
      type="button"
      className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-grab active:cursor-grabbing shadow-sm"
      title="Drag to reorder"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-gray-500"
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
      "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
    success:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium shadow-sm transition ${styles[variant]} disabled:opacity-60`}
    >
      {children}
    </button>
  );
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

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border max-h-[90vh] flex flex-col">
          <div className="px-5 py-4 border-b flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Planned Purchase" : "Add Planned Purchase"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingId
                  ? "Update this item and save the changes."
                  : "Add a future item you want to buy later."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {formErr && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {formErr}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={form.productName}
                onChange={onChange}
                placeholder="e.g. Blender, Headphone, Rice Cooker"
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  placeholder="e.g. Appliance"
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={onChange}
                  placeholder="e.g. Philips"
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Price
                </label>
                <input
                  type="number"
                  min="0"
                  name="expectedPrice"
                  value={form.expectedPrice}
                  onChange={onChange}
                  placeholder="e.g. 7000"
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Link
                </label>
                <input
                  type="text"
                  name="productLink"
                  value={form.productLink}
                  onChange={onChange}
                  placeholder="Optional URL"
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ownership
                </label>
                <select
                  name="ownershipType"
                  value={form.ownershipType}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="shared">Shared</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment
                </label>
                <select
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="undecided">Undecided</option>
                  <option value="cash">Cash</option>
                  <option value="emi">EMI</option>
                  <option value="either">Either</option>
                </select>
              </div>
            </div>

            {form.ownershipType === "personal" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal For <span className="text-red-500">*</span>
                </label>
                <select
                  name="personalForUserId"
                  value={form.personalForUserId}
                  onChange={onChange}
                  className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows="5"
                name="notes"
                value={form.notes}
                onChange={onChange}
                placeholder="Optional details, color, model preference, timing, etc."
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
          </form>

          <div className="border-t px-5 py-4 bg-white flex gap-3">
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="flex-1 rounded-xl border py-3 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="flex-1 rounded-xl bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 disabled:opacity-60"
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
      className={`rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-4 md:p-5 transition ${
        isDragging ? "shadow-xl opacity-80" : "shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="flex gap-3 min-w-0 flex-1">
          <div className="pt-1">
            <DragHandle {...attributes} {...listeners} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="text-lg font-semibold text-gray-900">
                {item.productName}
              </div>

              <span
                className={`text-xs border px-2.5 py-1 rounded-full capitalize ${badgeClass(
                  "priority",
                  item.priority
                )}`}
              >
                {item.priority}
              </span>

              <span
                className={`text-xs border px-2.5 py-1 rounded-full capitalize ${badgeClass(
                  "ownership",
                  item.ownershipType
                )}`}
              >
                {item.ownershipType}
              </span>

              <span
                className={`text-xs border px-2.5 py-1 rounded-full capitalize ${badgeClass(
                  "payment",
                  item.paymentMode
                )}`}
              >
                {item.paymentMode}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
              <div>
                <span className="text-gray-400">Brand:</span>{" "}
                <span className="font-medium text-gray-800">{item.brand || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400">Category:</span>{" "}
                <span className="font-medium text-gray-800">{item.category || "—"}</span>
              </div>

              {item.ownershipType === "personal" && (
                <div>
                  <span className="text-gray-400">Personal For:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {personalName || "Unknown"}
                  </span>
                </div>
              )}

              <div>
                <span className="text-gray-400">Estimated Cost:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {formatMoney(item.expectedPrice || 0)}
                </span>
              </div>
            </div>

            {item.notes ? (
              <div className="mt-3 rounded-2xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-600">
                <span className="text-gray-400">Note:</span> {item.notes}
              </div>
            ) : null}

            {item.productLink ? (
              <div className="pt-3">
                <a
                  href={item.productLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline break-all"
                >
                  View Product Link
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div className="xl:min-w-[220px]">
          <div className="text-xs text-gray-400 whitespace-nowrap mb-3 xl:text-right">
            Added {new Date(item.createdAt).toLocaleDateString()}
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
    <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50/30 p-4 md:p-5 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="text-lg font-semibold text-gray-900">{item.productName}</div>

            <span className="text-xs border px-2.5 py-1 rounded-full bg-green-50 text-green-700 border-green-200">
              bought
            </span>

            <span
              className={`text-xs border px-2.5 py-1 rounded-full capitalize ${badgeClass(
                "ownership",
                item.ownershipType
              )}`}
            >
              {item.ownershipType}
            </span>

            <span
              className={`text-xs border px-2.5 py-1 rounded-full capitalize ${badgeClass(
                "payment",
                item.paymentMode
              )}`}
            >
              {item.paymentMode}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
            <div>
              <span className="text-gray-400">Brand:</span>{" "}
              <span className="font-medium text-gray-800">{item.brand || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400">Category:</span>{" "}
              <span className="font-medium text-gray-800">{item.category || "—"}</span>
            </div>

            {item.ownershipType === "personal" && (
              <div>
                <span className="text-gray-400">Personal For:</span>{" "}
                <span className="font-medium text-gray-800">{personalName || "Unknown"}</span>
              </div>
            )}

            <div>
              <span className="text-gray-400">Planned Cost:</span>{" "}
              <span className="font-semibold text-gray-900">
                {formatMoney(item.expectedPrice || 0)}
              </span>
            </div>
          </div>

          {item.notes ? (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-600">
              <span className="text-gray-400">Note:</span> {item.notes}
            </div>
          ) : null}
        </div>

        <div className="xl:min-w-[220px]">
          <div className="text-xs text-gray-400 whitespace-nowrap mb-3 xl:text-right">
            Updated {new Date(item.updatedAt).toLocaleDateString()}
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
      const rank = { high: 1, medium: 2, low: 3 };
      list.sort((a, b) => rank[a.priority] - rank[b.priority]);
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

    return {
      activeCount: activeItems.length,
      boughtCount: boughtItems.length,
      estimatedTotal,
    };
  }, [activeItems, boughtItems]);

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
      <div className="mx-auto px-2 sm:px-4 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Planned Purchases
            </h2>
            <p className="text-sm text-gray-600">
              Plan future products and organize what to buy next.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadInitialData}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-sm hover:bg-gray-800"
            >
              Add Purchase
            </button>
          </div>
        </div>

        {notice.text ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${statusPillClass(
              notice.type
            )}`}
          >
            {notice.text}
          </div>
        ) : null}

        {err && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            <div className="font-semibold mb-1">Couldn’t load planned items</div>
            <div className="text-sm">{err}</div>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Active Planned Items"
              value={summary.activeCount}
              hint="Items waiting to be bought"
            />
            <StatCard
              title="Bought Items"
              value={summary.boughtCount}
              hint="Items already completed"
            />
            <StatCard
              title="Estimated Total"
              value={formatMoney(summary.estimatedTotal)}
              hint="Based on all active planned items"
            />
          </div>
        )}

        <div className="bg-white border rounded-2xl p-3 mb-6 flex gap-2 w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              activeTab === "active"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Active Plans
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              activeTab === "history"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Bought History
          </button>
        </div>

        {activeTab === "active" ? (
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search, Filter & Sort
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag reorder works only when sort is set to Manual and filters are cleared.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFilters(initialFilters)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="xl:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search by name, brand, category, note, person"
                    className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={filters.priority}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ownership
                  </label>
                  <select
                    name="ownershipType"
                    value={filters.ownershipType}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="shared">Shared</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment
                  </label>
                  <select
                    name="paymentMode"
                    value={filters.paymentMode}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="all">All</option>
                    <option value="undecided">Undecided</option>
                    <option value="cash">Cash</option>
                    <option value="emi">EMI</option>
                    <option value="either">Either</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="manual">Manual Order</option>
                    <option value="latest">Latest Added</option>
                    <option value="price-high">Price High to Low</option>
                    <option value="price-low">Price Low to High</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Planned Items
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Organize these by drag and drop when using manual order.
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  {reordering ? "Saving order..." : `${filteredActiveItems.length} item(s) shown`}
                </div>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ) : filteredActiveItems.length === 0 ? (
                <div className="border border-dashed rounded-2xl p-10 text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    No matching active planned purchases
                  </div>
                  <div className="text-sm text-gray-500">
                    Try changing search, filters, or add a new item.
                  </div>
                </div>
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
          <div className="bg-white border rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Bought History
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Items already completed are kept here instead of being removed.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : boughtItems.length === 0 ? (
              <div className="border border-dashed rounded-2xl p-10 text-center">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  No bought items yet
                </div>
                <div className="text-sm text-gray-500">
                  When you mark an active item as bought, it will appear here.
                </div>
              </div>
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