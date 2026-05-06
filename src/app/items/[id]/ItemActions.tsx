"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Dialog from "@/components/Dialog";
import { useToast } from "@/components/ToastProvider";
import { statusLabel } from "@/lib/utils";

const ALL_STATUSES = ["PERDIDO", "ENCONTRADO", "EM_VERIFICACAO", "DEVOLVIDO"] as const;

export default function ItemActions({
  itemId,
  isOwner,
  isAdmin,
  currentStatus,
}: {
  itemId: string;
  isOwner: boolean;
  isAdmin: boolean;
  currentStatus: string;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [savingStatus, setSavingStatus] = useState(false);

  async function onDelete() {
    setDeleting(true);
    const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      show("Erro ao excluir.", "error");
      return;
    }
    show("Item excluído.", "success");
    router.push("/?flash=" + encodeURIComponent("Item excluído.") + "&type=success");
    router.refresh();
  }

  async function onSaveStatus() {
    setSavingStatus(true);
    const res = await fetch(`/api/items/${itemId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSavingStatus(false);
    if (!res.ok) {
      show("Erro ao alterar status.", "error");
      return;
    }
    show("Status atualizado.", "success");
    setStatusOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isOwner && (
        <>
          <Link href={`/items/${itemId}/edit`} className="btn-secondary">
            Editar
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-danger"
          >
            Excluir
          </button>
        </>
      )}
      {isAdmin && (
        <button onClick={() => setStatusOpen(true)} className="btn-primary">
          Alterar status
        </button>
      )}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir item"
      >
        <p className="text-sm text-slate-700">
          Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="btn-secondary"
            onClick={() => setConfirmDelete(false)}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Dialog>

      <Dialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Alterar status do item"
      >
        <div className="flex flex-col gap-3">
          <label className="label" htmlFor="new-status">
            Novo status
          </label>
          <select
            id="new-status"
            className="input"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setStatusOpen(false)}
              disabled={savingStatus}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={onSaveStatus}
              disabled={savingStatus}
            >
              {savingStatus ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
