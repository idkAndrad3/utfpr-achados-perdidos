"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function NewItemForm() {
  const router = useRouter();
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"PERDIDO" | "ENCONTRADO">("PERDIDO");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ELETRONICOS");
  const [location, setLocation] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

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

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      show("Geolocalização não suportada pelo navegador.", "error");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(
          `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`
        );
        setGeoLoading(false);
      },
      () => {
        show("Não foi possível obter sua localização.", "error");
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecione uma foto para o registro.");
      return;
    }
    if (title.trim().length === 0 || title.length > 150) {
      setError("Título inválido (1 a 150 caracteres).");
      return;
    }
    if (description.trim().length === 0 || description.length > 2000) {
      setError("Descrição inválida (1 a 2000 caracteres).");
      return;
    }
    if (location.length > 200) {
      setError("Local muito longo (máximo 200 caracteres).");
      return;
    }

    const fd = new FormData();
    fd.append("type", type);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("category", category);
    fd.append("location", location);
    fd.append("photo", file);

    setLoading(true);
    const res = await fetch("/api/items", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Erro ao cadastrar o item.");
      show("Erro ao cadastrar o item.", "error");
      return;
    }
    show("Item cadastrado com sucesso!", "success");
    router.push("/?flash=" + encodeURIComponent("Item cadastrado com sucesso!") + "&type=success");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="label">Tipo</legend>
        <label
          className={
            "cursor-pointer rounded-md border px-4 py-3 text-center text-sm font-medium " +
            (type === "PERDIDO"
              ? "border-utfpr-500 bg-utfpr-50 text-utfpr-800"
              : "border-slate-300 bg-white text-slate-700")
          }
        >
          <input
            type="radio"
            name="type"
            value="PERDIDO"
            checked={type === "PERDIDO"}
            onChange={() => setType("PERDIDO")}
            className="sr-only"
          />
          Perdido
        </label>
        <label
          className={
            "cursor-pointer rounded-md border px-4 py-3 text-center text-sm font-medium " +
            (type === "ENCONTRADO"
              ? "border-utfpr-500 bg-utfpr-50 text-utfpr-800"
              : "border-slate-300 bg-white text-slate-700")
          }
        >
          <input
            type="radio"
            name="type"
            value="ENCONTRADO"
            checked={type === "ENCONTRADO"}
            onChange={() => setType("ENCONTRADO")}
            className="sr-only"
          />
          Encontrado
        </label>
      </fieldset>

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
        <div className="mt-1 text-xs text-slate-500">
          {title.length}/150
        </div>
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
        <div className="mt-1 text-xs text-slate-500">
          {description.length}/2000
        </div>
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
          Local aproximado (opcional)
        </label>
        <div className="flex gap-2">
          <input
            id="location"
            type="text"
            maxLength={200}
            className="input flex-1"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button
            type="button"
            onClick={useMyLocation}
            className="btn-secondary whitespace-nowrap"
            disabled={geoLoading}
          >
            {geoLoading ? "Obtendo..." : "Usar minha localização"}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="photo" className="label">
          Foto * (JPG ou PNG, até 5 MB)
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
            className="mt-3 h-48 w-full rounded-md border border-slate-200 object-cover"
          />
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>
  );
}
