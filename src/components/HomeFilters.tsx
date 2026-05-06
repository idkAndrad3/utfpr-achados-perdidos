"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  defaultStatus: string;
  defaultCategory: string;
};

export default function HomeFilters({ defaultStatus, defaultCategory }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function applyFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "ALL") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="filter-category" className="label">
          Categoria
        </label>
        <select
          id="filter-category"
          className="input"
          defaultValue={defaultCategory}
          onChange={(e) => applyFilter("category", e.target.value)}
        >
          <option value="ALL">Todas</option>
          <option value="ELETRONICOS">Eletrônicos</option>
          <option value="DOCUMENTOS">Documentos</option>
          <option value="VESTUARIO">Vestuário</option>
          <option value="OUTROS">Outros</option>
        </select>
      </div>
      <div className="flex-1">
        <label htmlFor="filter-status" className="label">
          Status
        </label>
        <select
          id="filter-status"
          className="input"
          defaultValue={defaultStatus}
          onChange={(e) => applyFilter("status", e.target.value)}
        >
          <option value="ALL">Todos</option>
          <option value="PERDIDO">Perdido</option>
          <option value="ENCONTRADO">Encontrado</option>
          <option value="EM_VERIFICACAO">Em verificação</option>
          <option value="DEVOLVIDO">Devolvido</option>
        </select>
      </div>
    </div>
  );
}
