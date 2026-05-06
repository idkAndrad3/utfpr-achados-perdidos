import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });
    }
    const { id } = await params;
    const c = await prisma.comment.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/comments/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir comentário." }, { status: 500 });
  }
}
