"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Defaults = {
  title: string;
  description: string;
  category: string;
  location: string;
  photoUrl: string;
};

export default function EditItemForm({
  itemId,
  defaults,
}: {
  itemId: string;
  defaults: Defaults;
}) {
  const router = useRouter();
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [category, setCategory] = useState(defaults.category);
  const [location, setLocation] = useState(defaults.location);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) return setPreview(null);
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setError("Apenas imagens JPG ou PNG são permitidas.");
      e.target.value = "";
      setPreview(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("A imagem excede o tamanho máximo de 5 MB.");
      e.target.value = "";
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length === 0 || title.length > 150) {
      setError("Título inválido.");
      return;
    }
    if (description.trim().length === 0 || description.length > 2000) {
      setError("Descrição inválida.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("category", category);
    fd.append("location", location);
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("photo", file);

    setLoading(true);
    const res = await fetch(`/api/items/${itemId}`, { method: "PUT", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Erro ao salvar.");
      show("Erro ao salvar.", "error");
      return;
    }
    show("Item atualizado.", "success");
    router.push(`/items/${itemId}?flash=` + encodeURIComponent("Item atualizado.") + "&type=success");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className="label">
          Título *
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={150}
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="description" className="label">
          Descrição *
        </label>
        <textarea
          id="description"
          required
          maxLength={2000}
          rows={5}
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="category" className="label">
          Categoria *
        </label>
        <select
          id="category"
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="ELETRONICOS">Eletrônicos</option>
          <option value="DOCUMENTOS">Documentos</option>
          <option value="VESTUARIO">Vestuário</option>
          <option value="OUTROS">Outros</option>
        </select>
      </div>
      <div>
        <label htmlFor="location" className="label">
          Local aproximado
        </label>
        <input
          id="location"
          type="text"
          maxLength={200}
          className="input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Foto atual</label>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={defaults.photoUrl}
          alt="Foto atual"
          className="h-40 w-full rounded-md border border-slate-200 object-cover sm:w-64"
        />
        <label htmlFor="photo" className="label mt-3">
          Trocar foto (opcional)
        </label>
        <input
          ref={fileRef}
          id="photo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={onFileChange}
          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-utfpr-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-utfpr-700"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
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
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
