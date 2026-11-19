"use client";
import * as React from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, GripVertical, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface EditState {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
}

export function FaqManager({ initialFaqs }: { initialFaqs: FaqItem[] }) {
  const [faqs, setFaqs] = React.useState<FaqItem[]>(initialFaqs);
  const [loading, setLoading] = React.useState(false);

  // Add form state
  const [addOpen, setAddOpen] = React.useState(false);
  const [newQ, setNewQ] = React.useState("");
  const [newA, setNewA] = React.useState("");
  const [addLoading, setAddLoading] = React.useState(false);

  // Edit state
  const [editState, setEditState] = React.useState<EditState | null>(null);
  const [editLoading, setEditLoading] = React.useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  /* ── helpers ── */
  async function refetch() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/faq");
      const json = await res.json();
      if (json.success) setFaqs(json.data.faqs);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newQ.trim() || !newA.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQ.trim(), answer: newA.trim(), order: faqs.length }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message ?? "Failed to add FAQ"); return; }
      toast.success("FAQ added");
      setNewQ(""); setNewA(""); setAddOpen(false);
      await refetch();
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEdit() {
    if (!editState) return;
    if (!editState.question.trim() || !editState.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/faq/${editState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: editState.question.trim(),
          answer:   editState.answer.trim(),
          isActive: editState.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message ?? "Failed to update"); return; }
      toast.success("FAQ updated");
      setEditState(null);
      await refetch();
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    if (res.status === 204 || res.ok) {
      toast.success("FAQ deleted");
      setDeleteId(null);
      await refetch();
    } else {
      const json = await res.json().catch(() => ({}));
      toast.error(json.message ?? "Failed to delete");
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = faqs.findIndex((f) => f.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === faqs.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newFaqs = [...faqs];
    [newFaqs[idx], newFaqs[swapIdx]] = [newFaqs[swapIdx], newFaqs[idx]];
    setFaqs(newFaqs);

    // Persist new orders
    await Promise.all([
      fetch(`/api/admin/faq/${newFaqs[idx].id}`,    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: idx }) }),
      fetch(`/api/admin/faq/${newFaqs[swapIdx].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: swapIdx }) }),
    ]);
  }

  async function handleToggleActive(faq: FaqItem) {
    const res = await fetch(`/api/admin/faq/${faq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !faq.isActive }),
    });
    if (res.ok) {
      toast.success(faq.isActive ? "FAQ hidden from store" : "FAQ shown on store");
      await refetch();
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-rose-100">
            <MessageCircleQuestion className="size-5 text-rose-500" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-sky-950">FAQ Manager</h1>
            <p className="text-xs text-sky-700/70">{faqs.length} questions · drag/reorder with arrows</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setAddOpen((v) => !v)}
        >
          <Plus className="size-4" />
          Add FAQ
        </Button>
      </div>

      {/* Add FAQ form */}
      {addOpen && (
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>New FAQ</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-sky-800 mb-1">Question *</label>
              <input
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                placeholder="e.g. What is your return policy?"
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sky-800 mb-1">Answer *</label>
              <textarea
                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 min-h-[90px] resize-y"
                placeholder="Write the answer here..."
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
                maxLength={2000}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setAddOpen(false); setNewQ(""); setNewA(""); }}>Cancel</Button>
              <Button size="sm" onClick={handleAdd} disabled={addLoading}>
                {addLoading ? "Saving…" : "Save FAQ"}
              </Button>
            </div>
          </AdminCardContent>
        </AdminCard>
      )}

      {/* FAQ list */}
      {loading ? (
        <div className="text-sm text-sky-700/60 py-8 text-center">Loading…</div>
      ) : faqs.length === 0 ? (
        <AdminCard>
          <AdminCardContent className="py-12 text-center text-sm text-sky-700/60">
            No FAQs yet. Click &quot;Add FAQ&quot; to create your first one.
          </AdminCardContent>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <AdminCard key={faq.id} className={!faq.isActive ? "opacity-60" : ""}>
              <AdminCardContent className="p-4">
                {editState?.id === faq.id ? (
                  /* ── Inline edit ── */
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                      value={editState.question}
                      onChange={(e) => setEditState({ ...editState, question: e.target.value })}
                      maxLength={300}
                    />
                    <textarea
                      className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 min-h-[80px] resize-y"
                      value={editState.answer}
                      onChange={(e) => setEditState({ ...editState, answer: e.target.value })}
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-sky-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editState.isActive}
                          onChange={(e) => setEditState({ ...editState, isActive: e.target.checked })}
                          className="rounded"
                        />
                        Visible on store
                      </label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditState(null)}>
                          <X className="size-3.5 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleEdit} disabled={editLoading}>
                          <Check className="size-3.5 mr-1" />{editLoading ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── View row ── */
                  <div className="flex gap-3 items-start">
                    {/* order badge */}
                    <span className="mt-0.5 shrink-0 grid size-6 place-items-center rounded-md bg-sky-100 text-xs font-bold text-sky-700">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-sky-950 leading-snug">{faq.question}</p>
                      <p className="text-xs text-sky-700/70 mt-1 line-clamp-2">{faq.answer}</p>
                    </div>
                    {/* actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* up/down */}
                      <button
                        onClick={() => handleMove(faq.id, "up")}
                        disabled={idx === 0}
                        title="Move up"
                        className="grid size-7 place-items-center rounded-lg text-sky-500 hover:bg-sky-100 disabled:opacity-30 transition"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        onClick={() => handleMove(faq.id, "down")}
                        disabled={idx === faqs.length - 1}
                        title="Move down"
                        className="grid size-7 place-items-center rounded-lg text-sky-500 hover:bg-sky-100 disabled:opacity-30 transition"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      {/* toggle visible */}
                      <button
                        onClick={() => handleToggleActive(faq)}
                        title={faq.isActive ? "Hide from store" : "Show on store"}
                        className={`grid size-7 place-items-center rounded-lg transition text-xs font-bold ${
                          faq.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        {faq.isActive ? "ON" : "OFF"}
                      </button>
                      {/* edit */}
                      <button
                        onClick={() => setEditState({ id: faq.id, question: faq.question, answer: faq.answer, isActive: faq.isActive })}
                        title="Edit"
                        className="grid size-7 place-items-center rounded-lg text-sky-500 hover:bg-sky-100 transition"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      {/* delete */}
                      {deleteId === faq.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleDelete(faq.id)} className="rounded px-2 py-0.5 bg-red-500 text-white text-xs font-medium hover:bg-red-600">Yes</button>
                          <button onClick={() => setDeleteId(null)} className="rounded px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300">No</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteId(faq.id)}
                          title="Delete"
                          className="grid size-7 place-items-center rounded-lg text-red-400 hover:bg-red-50 transition"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </AdminCardContent>
            </AdminCard>
          ))}
        </div>
      )}

      {/* grip icon legend */}
      {faqs.length > 0 && (
        <p className="text-center text-xs text-sky-700/50 flex items-center justify-center gap-1">
          <GripVertical className="size-3" /> Use ↑ ↓ arrows to reorder FAQs · changes save instantly
        </p>
      )}
    </div>
  );
}
