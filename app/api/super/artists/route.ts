import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const artists = await prisma.artist.findMany({
    include: {
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(artists);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, subdomain, email, password, primaryColor } = body;

  if (!name || !subdomain || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const artist = await prisma.artist.create({
      data: {
        name,
        subdomain,
        primaryColor: primaryColor || "#000000",
        users: {
          create: {
            email,
            password: hashedPassword,
            name: `${name} Admin`,
            role: "ARTIST_ADMIN",
          },
        },
      },
    });

    return NextResponse.json(artist);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
