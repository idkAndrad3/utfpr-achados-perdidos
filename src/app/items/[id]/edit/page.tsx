import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EditItemForm from "./EditItemForm";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/items/${id}/edit`);
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) notFound();
  const isOwner = item.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect(`/items/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/items/${id}`} className="btn-secondary">
          ← Voltar
        </Link>
      </div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
        Editar Item
      </h1>
      <div className="card p-6">
        <EditItemForm
          itemId={item.id}
          defaults={{
            title: item.title,
            description: item.description,
            category: item.category,
            location: item.location ?? "",
            photoUrl: item.photoUrl,
          }}
        />
      </div>
    </div>
  );
}
