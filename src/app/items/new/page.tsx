import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewItemForm from "./NewItemForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/items/new");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="btn-secondary">
          ← Voltar
        </Link>
      </div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">
        Novo Registro
      </h1>
      <div className="card p-6">
        <NewItemForm />
      </div>
    </div>
  );
}
