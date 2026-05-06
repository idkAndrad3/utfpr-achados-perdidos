import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["PERDIDO", "ENCONTRADO", "EM_VERIFICACAO", "DEVOLVIDO"] as const;

const schema = z.object({
  status: z.enum(VALID_STATUSES),
});

export async function PATCH(
  req: Request,
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
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    if (item.status === parsed.data.status) {
      return NextResponse.json({ ok: true });
    }
    await prisma.item.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await prisma.statusLog.create({
      data: {
        itemId: id,
        previousStatus: item.status,
        newStatus: parsed.data.status,
        changedById: session.user.id,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/items/[id]/status PATCH]", err);
    return NextResponse.json({ error: "Erro ao atualizar status." }, { status: 500 });
  }
}
