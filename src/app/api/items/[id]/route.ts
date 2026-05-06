import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { saveUploadedImage, UploadError } from "@/lib/upload";
import { sanitizeText } from "@/lib/utils";

const VALID_CATEGORIES = ["ELETRONICOS", "DOCUMENTOS", "VESTUARIO", "OUTROS"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true } } },
        },
        claims: {
          orderBy: { createdAt: "desc" },
          include: { claimant: { select: { id: true, name: true } } },
        },
        statusLogs: {
          orderBy: { createdAt: "asc" },
          include: { changedBy: { select: { id: true, name: true } } },
        },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("[api/items/[id] GET]", err);
    return NextResponse.json({ error: "Erro ao buscar item." }, { status: 500 });
  }
}

const updateSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(2000),
  category: z.enum(VALID_CATEGORIES),
  location: z.string().max(200).optional(),
});

export async function PUT(
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
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }
    const isOwner = item.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const form = await req.formData();
    const raw = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      category: String(form.get("category") ?? ""),
      location: String(form.get("location") ?? "").trim() || undefined,
    };
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    let photoUrl: string | undefined = undefined;
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      photoUrl = await saveUploadedImage(photo);
    }

    await prisma.item.update({
      where: { id },
      data: {
        title: sanitizeText(parsed.data.title),
        description: sanitizeText(parsed.data.description),
        category: parsed.data.category,
        location: parsed.data.location ? sanitizeText(parsed.data.location) : null,
        ...(photoUrl ? { photoUrl } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/items/[id] PUT]", err);
    return NextResponse.json({ error: "Erro ao atualizar item." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const { id } = await params;
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }
    const isOwner = item.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/items/[id] DELETE]", err);
    return NextResponse.json({ error: "Erro ao excluir item." }, { status: 500 });
  }
}
