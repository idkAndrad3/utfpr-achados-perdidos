import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Página não encontrada</h1>
      <p className="text-slate-600">
        O conteúdo que você procura não existe ou foi removido.
      </p>
      <Link href="/" className="btn-primary">
        Voltar para o início
      </Link>
    </div>
  );
}
