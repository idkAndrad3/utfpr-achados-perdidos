import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(120),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name: sanitizeText(name),
        email: email.toLowerCase().trim(),
        password: hash,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register] erro:", err);
    return NextResponse.json(
      { error: "Erro ao processar cadastro." },
      { status: 500 }
    );
  }
}
