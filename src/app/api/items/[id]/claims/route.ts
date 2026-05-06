import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { saveUploadedImage, UploadError } from "@/lib/upload";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({
  description: z.string().min(1).max(500),
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
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

    if (item.type !== "ENCONTRADO" || item.status === "DEVOLVIDO") {
      return NextResponse.json(
        { error: "Este item não aceita reivindicações." },
        { status: 400 }
      );
    }
    if (item.authorId === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode reivindicar seu próprio item." },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const parsed = schema.safeParse({
      description: String(form.get("description") ?? "").trim(),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Descrição obrigatória (até 500 caracteres)." },
        { status: 400 }
      );
    }

    let proofImageUrl: string | undefined = undefined;
    const proof = form.get("proof");
    if (proof instanceof File && proof.size > 0) {
      proofImageUrl = await saveUploadedImage(proof);
    }

    const claim = await prisma.claim.create({
      data: {
        description: sanitizeText(parsed.data.description),
        proofImageUrl,
        itemId: id,
        claimantId: session.user.id,
      },
    });
    return NextResponse.json({ id: claim.id }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/items/[id]/claims POST]", err);
    return NextResponse.json({ error: "Erro ao reivindicar." }, { status: 500 });
  }
}
