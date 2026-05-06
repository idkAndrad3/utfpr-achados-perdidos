import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Cadastro</h1>
        <p className="mt-1 text-sm text-slate-600">
          Crie sua conta para registrar achados e perdidos da UTFPR.
        </p>
      </div>
      <div className="card p-6">
        <RegisterForm />
      </div>
      <div className="text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-utfpr-700 hover:underline">
          Entre aqui
        </Link>
      </div>
    </div>
  );
}
