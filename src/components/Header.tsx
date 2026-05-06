"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export default function Header({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-utfpr-600 text-white grid place-items-center font-bold">
            U
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-slate-900 sm:text-lg">
              Achados e Perdidos
            </div>
            <div className="hidden text-xs text-slate-500 sm:block">
              UTFPR — Universidade Tecnológica Federal do Paraná
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 sm:flex">
          {session?.user ? (
            <>
              <Link href="/items/new" className="btn-yellow">
                + Novo Registro
              </Link>
              <span className="text-sm text-slate-600">
                Olá,{" "}
                <strong className="text-slate-900">{session.user.name}</strong>
                {session.user.role === "ADMIN" && (
                  <span className="ml-2 badge bg-utfpr-100 text-utfpr-800 border-utfpr-200">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Entrar
              </Link>
              <Link href="/register" className="btn-primary">
                Cadastrar
              </Link>
            </>
          )}
        </nav>

        <button
          aria-label="Abrir menu"
          className="sm:hidden rounded-md border border-slate-300 px-3 py-2 text-sm"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>
      {open && (
        <div className="sm:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
            {session?.user ? (
              <>
                <Link
                  href="/items/new"
                  className="btn-yellow w-full"
                  onClick={() => setOpen(false)}
                >
                  + Novo Registro
                </Link>
                <div className="text-sm text-slate-600">
                  Olá, <strong>{session.user.name}</strong>
                  {session.user.role === "ADMIN" && (
                    <span className="ml-2 badge bg-utfpr-100 text-utfpr-800 border-utfpr-200">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  className="btn-ghost w-full"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="btn-primary w-full"
                  onClick={() => setOpen(false)}
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
