import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  categoryLabel,
  formatDateTime,
  statusColor,
  statusLabel,
} from "@/lib/utils";
import HomeFilters from "@/components/HomeFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

const VALID_CATEGORIES = ["ELETRONICOS", "DOCUMENTOS", "VESTUARIO", "OUTROS"] as const;
const VALID_STATUSES = ["PERDIDO", "ENCONTRADO", "EM_VERIFICACAO", "DEVOLVIDO"] as const;

type Search = {
  status?: string;
  category?: string;
  page?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  const sp = await searchParams;

  const status = VALID_STATUSES.includes(sp.status as never)
    ? (sp.status as (typeof VALID_STATUSES)[number])
    : undefined;
  const category = VALID_CATEGORIES.includes(sp.category as never)
    ? (sp.category as (typeof VALID_CATEGORIES)[number])
    : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Achados e Perdidos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Lista pública de itens reportados na UTFPR.
          </p>
        </div>
        {session?.user && (
          <Link href="/items/new" className="btn-yellow">
            + Novo Registro
          </Link>
        )}
      </div>

      <HomeFilters
        defaultStatus={status ?? "ALL"}
        defaultCategory={category ?? "ALL"}
      />

      {items.length === 0 ? (
        <div className="card mt-8 px-6 py-12 text-center text-slate-600">
          Ainda não há itens cadastrados.
        </div>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="card overflow-hidden">
                <Link href={`/items/${item.id}`} className="block">
                  <div className="aspect-video w-full bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={"badge " + statusColor[item.status]}>
                        {statusLabel[item.status]}
                      </span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    <div className="mt-1 text-sm text-slate-600">
                      {categoryLabel[item.category]}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              status={status}
              category={category}
            />
          )}
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  status,
  category,
}: {
  page: number;
  totalPages: number;
  status?: string;
  category?: string;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    params.set("page", String(p));
    return `/?${params.toString()}`;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={
          "btn-secondary " + (page === 1 ? "pointer-events-none opacity-50" : "")
        }
      >
        ← Anterior
      </Link>
      <span className="px-3 text-sm text-slate-600">
        Página {page} de {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={
          "btn-secondary " +
          (page === totalPages ? "pointer-events-none opacity-50" : "")
        }
      >
        Próxima →
      </Link>
    </div>
  );
}
