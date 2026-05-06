"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/Dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime } from "@/lib/utils";

type Comment = {
  id: string;
  text: string;
  createdAt: string | Date;
  author: { id: string; name: string };
};

export default function CommentsSection({
  itemId,
  initialComments,
  userId,
  isAdmin,
}: {
  itemId: string;
  initialComments: Comment[];
  userId?: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!text.trim() || text.length > 1000) {
      show("Comentário inválido (1 a 1000 caracteres).", "error");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/items/${itemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      show(data?.error ?? "Erro ao comentar.", "error");
      return;
    }
    const data = await res.json();
    setComments((prev) => [...prev, data.comment]);
    setText("");
    setOpen(false);
    show("Comentário adicionado.", "success");
  }

  async function onDelete(id: string) {
    if (!confirm("Excluir este comentário?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      show("Erro ao excluir comentário.", "error");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
    show("Comentário excluído.", "success");
  }

  return (
    <section className="card mt-6 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Comentários</h2>
      {comments.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Ainda não há comentários.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start justify-between">
                <div className="text-sm text-slate-600">
                  <strong className="text-slate-900">{c.author.name}</strong> ·{" "}
                  {formatDateTime(c.createdAt)}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onDelete(c.id)}
                    aria-label="Excluir comentário"
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑
                  </button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-slate-800">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {userId && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 rounded-full bg-utfpr-600 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-utfpr-700"
        >
          + Adicionar Comentário
        </button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar comentário"
      >
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={5}
            className="input"
            placeholder="Escreva seu comentário..."
          />
          <div className="text-right text-xs text-slate-500">{text.length}/1000</div>
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
