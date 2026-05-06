import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  action: z.enum(["APROVAR", "RECUSAR"]),
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
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });

    if (parsed.data.action === "APROVAR") {
      const item = await prisma.item.findUnique({ where: { id: claim.itemId } });
      if (!item) {
        return NextResponse.json({ error: "Item ausente." }, { status: 404 });
      }
      await prisma.claim.update({
        where: { id },
        data: { status: "APROVADA" },
      });
      if (item.status !== "DEVOLVIDO") {
        await prisma.item.update({
          where: { id: claim.itemId },
          data: { status: "DEVOLVIDO" },
        });
        await prisma.statusLog.create({
          data: {
            itemId: claim.itemId,
            previousStatus: item.status,
            newStatus: "DEVOLVIDO",
            changedById: session.user.id,
          },
        });
      }
    } else {
      await prisma.claim.update({
        where: { id },
        data: { status: "RECUSADA" },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/claims/[id] PATCH]", err);
    return NextResponse.json({ error: "Erro ao processar reivindicação." }, { status: 500 });
  }
}
