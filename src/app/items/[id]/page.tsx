import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  categoryLabel,
  formatDateTime,
  statusColor,
  statusLabel,
  typeColor,
  typeLabel,
} from "@/lib/utils";
import ItemActions from "./ItemActions";
import CommentsSection from "./CommentsSection";
import ClaimSection from "./ClaimSection";
import StatusTimeline from "./StatusTimeline";
import ClaimDecisionButtons from "./ClaimDecisionButtons";

export const dynamic = "force-dynamic";

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
      claims: {
        orderBy: { createdAt: "desc" },
        include: { claimant: { select: { id: true, name: true } } },
      },
      statusLogs: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true } } },
      },
    },
  });

  if (!item) notFound();

  const isOwner = !!session?.user && session.user.id === item.authorId;
  const isAdmin = !!session?.user && session.user.role === "ADMIN";
  const userId = session?.user?.id;

  const canClaim =
    !!session?.user &&
    item.type === "ENCONTRADO" &&
    item.status !== "DEVOLVIDO" &&
    item.authorId !== session.user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="btn-secondary">
          ← Voltar
        </Link>
        {(isOwner || isAdmin) && (
          <ItemActions
            itemId={item.id}
            isAdmin={isAdmin}
            isOwner={isOwner}
            currentStatus={item.status}
          />
        )}
      </div>

      <article className="card overflow-hidden">
        <div className="aspect-video w-full bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.photoUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Tipo:</span>
              <span className={"badge " + typeColor[item.type]}>
                {typeLabel[item.type]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Status:</span>
              <span className={"badge " + statusColor[item.status]}>
                {statusLabel[item.status]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Categoria:</span>
              <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                {categoryLabel[item.category]}
              </span>
            </div>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{item.title}</h1>
          <div className="mt-1 text-sm text-slate-500">
            Registrado por <strong className="text-slate-700">{item.author.name}</strong>{" "}
            em {formatDateTime(item.createdAt)}
          </div>
          {item.location && (
            <div className="mt-2 text-sm text-slate-600">
              <strong>Local:</strong> {item.location}
            </div>
          )}
          <p className="mt-4 whitespace-pre-line text-slate-800">
            {item.description}
          </p>
        </div>
      </article>

      {canClaim && <ClaimSection itemId={item.id} />}

      {isAdmin && item.claims.some((c) => c.status === "PENDENTE") && (
        <section className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Reivindicações Pendentes
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {item.claims
              .filter((c) => c.status === "PENDENTE")
              .map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="text-sm text-slate-600">
                    <strong className="text-slate-900">{c.claimant.name}</strong> ·{" "}
                    {formatDateTime(c.createdAt)}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-slate-800">
                    {c.description}
                  </p>
                  {c.proofImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.proofImageUrl}
                      alt="Prova adicional"
                      className="mt-3 h-40 w-full rounded-md border border-slate-200 object-cover sm:w-64"
                    />
                  )}
                  <ClaimDecisionButtons claimId={c.id} />
                </li>
              ))}
          </ul>
        </section>
      )}

      {item.claims.some((c) => c.status !== "PENDENTE") && (
        <section className="card mt-6 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Histórico de Reivindicações
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {item.claims
              .filter((c) => c.status !== "PENDENTE")
              .map((c) => (
                <li
                  key={c.id}
                  className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                >
                  <span className="text-slate-600">
                    <strong className="text-slate-900">{c.claimant.name}</strong> ·{" "}
                    {formatDateTime(c.createdAt)} ·{" "}
                    <span
                      className={
                        c.status === "APROVADA"
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      {c.status === "APROVADA" ? "Aprovada" : "Recusada"}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <StatusTimeline logs={item.statusLogs} />

      <CommentsSection
        itemId={item.id}
        initialComments={item.comments}
        userId={userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
