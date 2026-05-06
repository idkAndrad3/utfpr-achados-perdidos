"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/Dialog";
import { useToast } from "@/components/ToastProvider";

export default function ClaimSection({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const proofRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) return setProofPreview(null);
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setError("Apenas imagens JPG ou PNG são permitidas.");
      e.target.value = "";
      setProofPreview(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("A imagem excede o tamanho máximo de 5 MB.");
      e.target.value = "";
      setProofPreview(null);
      return;
    }
    setProofPreview(URL.createObjectURL(f));
  }

  async function onSubmit() {
    setError(null);
    if (!description.trim() || description.length > 500) {
      setError("Descrição inválida (1 a 500 caracteres).");
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("description", description);
    const proof = proofRef.current?.files?.[0];
    if (proof) fd.append("proof", proof);
    const res = await fetch(`/api/items/${itemId}/claims`, {
      method: "POST",
      body: fd,
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Erro ao reivindicar.");
      show("Erro ao enviar reivindicação.", "error");
      return;
    }
    show("Reivindicação enviada para análise.", "success");
    setOpen(false);
    setDescription("");
    setProofPreview(null);
    if (proofRef.current) proofRef.current.value = "";
    router.refresh();
  }

  return (
    <section className="card mt-6 p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        É seu? Reivindique este item
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Caso você seja o dono deste item encontrado, descreva detalhes que comprovem
        a posse. Um administrador irá analisar.
      </p>
      <button onClick={() => setOpen(true)} className="btn-primary mt-3">
        Reivindicar
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Reivindicar item"
      >
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="claim-desc" className="label">
              Descreva brevemente como este item lhe pertence *
            </label>
            <textarea
              id="claim-desc"
              maxLength={500}
              rows={5}
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="mt-1 text-xs text-slate-500">
              {description.length}/500
            </div>
          </div>
          <div>
            <label htmlFor="proof" className="label">
              Imagem adicional (opcional)
            </label>
            <input
              ref={proofRef}
              id="proof"
              type="file"
              accept="image/jpeg,image/png"
              onChange={onProofChange}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-utfpr-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-utfpr-700"
            />
            {proofPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proofPreview}
                alt="Pré-visualização"
                className="mt-3 h-40 w-full rounded-md border border-slate-200 object-cover"
              />
            )}
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={onSubmit}
              disabled={saving}
            >
              {saving ? "Enviando..." : "Enviar Reivindicação"}
            </button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
