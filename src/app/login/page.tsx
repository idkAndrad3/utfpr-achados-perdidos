import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect(params.callbackUrl || "/");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acesse sua conta para registrar e gerenciar achados e perdidos.
        </p>
      </div>
      <div className="card p-6">
        <LoginForm callbackUrl={params.callbackUrl} initialError={params.error} />
      </div>
      <div className="text-center text-sm text-slate-600">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-utfpr-700 hover:underline">
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}
