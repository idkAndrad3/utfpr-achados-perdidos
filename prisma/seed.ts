import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando banco de dados...");
  await prisma.statusLog.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando usuários de teste...");
  const passwordHash = await bcrypt.hash("SenhaTeste123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Administrador UTFPR",
      email: "admin@utfpr.br",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Aluno Teste",
      email: "usuario@utfpr.br",
      password: passwordHash,
      role: "USER",
    },
  });

  console.log("Criando itens de exemplo...");
  const placeholder = "/uploads/placeholder.svg";

  const itemsData = [
    {
      title: "Carteira preta perdida na biblioteca",
      description: "Carteira de couro preta com documentos pessoais e cartões.",
      type: "PERDIDO",
      category: "DOCUMENTOS",
      location: "Biblioteca Central — 2º andar",
      status: "PERDIDO",
      photoUrl: placeholder,
      authorId: user.id,
    },
    {
      title: "Mochila azul desaparecida",
      description: "Mochila azul-marinho da marca Nike, contendo cadernos e estojo.",
      type: "PERDIDO",
      category: "OUTROS",
      location: "Bloco F — Sala F-12",
      status: "PERDIDO",
      photoUrl: placeholder,
      authorId: user.id,
    },
    {
      title: "Pendrive Sandisk encontrado",
      description: "Pendrive prata de 32GB encontrado em uma cadeira do laboratório.",
      type: "ENCONTRADO",
      category: "ELETRONICOS",
      location: "Laboratório de Informática — Bloco G",
      status: "EM_VERIFICACAO",
      photoUrl: placeholder,
      authorId: admin.id,
    },
    {
      title: "Casaco cinza encontrado",
      description: "Casaco cinza tamanho M encontrado em uma sala de aula.",
      type: "ENCONTRADO",
      category: "VESTUARIO",
      location: "Bloco D — Sala D-04",
      status: "EM_VERIFICACAO",
      photoUrl: placeholder,
      authorId: admin.id,
    },
    {
      title: "Óculos de grau encontrados",
      description: "Óculos com armação preta e estojo verde.",
      type: "ENCONTRADO",
      category: "OUTROS",
      location: "Restaurante Universitário",
      status: "ENCONTRADO",
      photoUrl: placeholder,
      authorId: admin.id,
    },
    {
      title: "Celular Motorola devolvido ao dono",
      description: "Celular Motorola Moto G entregue ao dono após verificação.",
      type: "ENCONTRADO",
      category: "ELETRONICOS",
      location: "Estacionamento principal",
      status: "DEVOLVIDO",
      photoUrl: placeholder,
      authorId: admin.id,
    },
    {
      title: "Chaveiro com chaves de carro entregue",
      description: "Chaveiro com chaves de carro Fiat e chave de armário, devolvido ao dono.",
      type: "ENCONTRADO",
      category: "OUTROS",
      location: "Portaria principal",
      status: "DEVOLVIDO",
      photoUrl: placeholder,
      authorId: admin.id,
    },
    {
      title: "Calculadora HP 12C esquecida em prova",
      description: "Calculadora HP 12C deixada na sala após avaliação.",
      type: "ENCONTRADO",
      category: "ELETRONICOS",
      location: "Bloco B — Sala B-21",
      status: "ENCONTRADO",
      photoUrl: placeholder,
      authorId: admin.id,
    },
  ];

  const createdItems = [];
  for (const data of itemsData) {
    const item = await prisma.item.create({ data });
    createdItems.push(item);
    await prisma.statusLog.create({
      data: {
        itemId: item.id,
        previousStatus: null,
        newStatus: item.status,
        changedById: item.authorId,
      },
    });
  }

  console.log("Criando comentários de exemplo...");
  await prisma.comment.create({
    data: {
      text: "Acho que vi essa carteira na recepção da biblioteca!",
      itemId: createdItems[0].id,
      authorId: admin.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "Tenta passar lá na portaria também, costuma ser entregue por lá.",
      itemId: createdItems[0].id,
      authorId: user.id,
    },
  });
  await prisma.comment.create({
    data: {
      text: "Esse pendrive é meu! Posso descrever os arquivos dentro.",
      itemId: createdItems[2].id,
      authorId: user.id,
    },
  });

  console.log("Criando reivindicação pendente...");
  await prisma.claim.create({
    data: {
      description:
        "Esse pendrive é meu, perdi na semana passada. Tem uma pasta chamada 'TCC' e arquivos do meu trabalho de conclusão.",
      itemId: createdItems[2].id,
      claimantId: user.id,
      status: "PENDENTE",
    },
  });

  console.log("Seed concluído com sucesso!");
  console.log("Usuários de teste:");
  console.log("  Admin:   admin@utfpr.br   / SenhaTeste123!");
  console.log("  Usuário: usuario@utfpr.br / SenhaTeste123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
