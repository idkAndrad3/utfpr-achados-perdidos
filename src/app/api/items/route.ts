import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { saveUploadedImage, UploadError } from "@/lib/upload";
import { sanitizeText } from "@/lib/utils";

const PAGE_SIZE = 9;

const VALID_CATEGORIES = ["ELETRONICOS", "DOCUMENTOS", "VESTUARIO", "OUTROS"] as const;
const VALID_STATUSES = ["PERDIDO", "ENCONTRADO", "EM_VERIFICACAO", "DEVOLVIDO"] as const;
const VALID_TYPES = ["PERDIDO", "ENCONTRADO"] as const;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);

    const where: Record<string, unknown> = {};
    if (status && VALID_STATUSES.includes(status as never)) where.status = status;
    if (category && VALID_CATEGORIES.includes(category as never)) where.category = category;

    const [total, items] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      items,
    });
  } catch (err) {
    console.error("[api/items GET]", err);
    return NextResponse.json({ error: "Erro ao listar itens." }, { status: 500 });
  }
}

const createSchema = z.object({
  type: z.enum(VALID_TYPES),
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(2000),
  category: z.enum(VALID_CATEGORIES),
  location: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const form = await req.formData();
    const raw = {
      type: String(form.get("type") ?? ""),
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      category: String(form.get("category") ?? ""),
      location: String(form.get("location") ?? "").trim() || undefined,
    };

    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const photo = form.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Foto obrigatória." }, { status: 400 });
    }
    const photoUrl = await saveUploadedImage(photo);

    const status = parsed.data.type === "ENCONTRADO" ? "EM_VERIFICACAO" : "PERDIDO";

    const item = await prisma.item.create({
      data: {
        title: sanitizeText(parsed.data.title),
        description: sanitizeText(parsed.data.description),
        type: parsed.data.type,
        category: parsed.data.category,
        location: parsed.data.location ? sanitizeText(parsed.data.location) : null,
        photoUrl,
        status,
        authorId: session.user.id,
      },
    });

    await prisma.statusLog.create({
      data: {
        itemId: item.id,
        previousStatus: null,
        newStatus: status,
        changedById: session.user.id,
      },
    });

    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[api/items POST]", err);
    return NextResponse.json({ error: "Erro ao cadastrar item." }, { status: 500 });
  }
}
