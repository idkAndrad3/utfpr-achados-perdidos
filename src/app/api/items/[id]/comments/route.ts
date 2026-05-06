import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({
  text: z.string().min(1).max(1000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Comentário inválido (1 a 1000 caracteres)." },
        { status: 400 }
      );
    }
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }
    const comment = await prisma.comment.create({
      data: {
        text: sanitizeText(parsed.data.text),
        itemId: id,
        authorId: session.user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("[api/items/[id]/comments POST]", err);
    return NextResponse.json({ error: "Erro ao comentar." }, { status: 500 });
  }
}
