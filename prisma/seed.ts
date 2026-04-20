import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── SUPER_ADMIN ────────────────────────────────────────────────────────────
  const superEmail = "admin@formalize.com";
  const superPass = "Admin@123";
  const superHashed = await hash(superPass, 12);

  const existingSuper = await prisma.user.findFirst({
    where: { email: superEmail, role: "SUPER_ADMIN" },
  });

  if (existingSuper) {
    await prisma.user.update({
      where: { id: existingSuper.id },
      data: { password: superHashed, name: "Super Admin" },
    });
    console.log(`✔ SUPER_ADMIN atualizado: ${superEmail}`);
  } else {
    await prisma.user.create({
      data: { email: superEmail, password: superHashed, name: "Super Admin", role: "SUPER_ADMIN" },
    });
    console.log(`✔ SUPER_ADMIN criado: ${superEmail}`);
  }

  // ── Artista de teste (Givago) ──────────────────────────────────────────────
  const artist = await prisma.artist.upsert({
    where: { subdomain: "givago" },
    update: {
      name: "Givago",
      primaryColor: "#E8A045",
      secondaryColor: "#ffffff",
      whatsapp: "556796921144",
      instagram: "https://www.instagram.com/givagooficial/",
      spotify: "https://open.spotify.com/intl-pt/artist/3guvb3bxPViYo54onCswVL",
      x: "https://twitter.com/twittdogivago",
      youtube: "https://www.youtube.com/@givagooficial7794",
      logoUrl: "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/logo.png",
      basePdfUrl: "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/base.pdf",
      baseContractPdfUrl: "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/base-contrato.pdf",
      paperWidth: "34.44",
      paperHeight: "48.71",
      instruments: "Bateria, Percussão, Guitarra, Baixo, Sanfona",
      website: "www.givagooficial.com.br",
      legalName: "Victor Givago Barbosa Caneppele",
      cnpj: "43.778.093/0001-92",
      address: {
        rua: "Rua das Folhagens",
        numero: "280",
        bairro: "Carandá Bosque",
        cidade: "Campo Grande",
        estado: "MS"
      },
      bankInfo: {
        titular: "Victor Givago Barbosa Caneppele",
        pix: "CNPJ 43.778.093/0001-92",
        banco: "Inter",
        conta: "22616151-0",
        agencia: "0001"
      },
      status: "ACTIVE",
    },
    create: {
      name: "Givago",
      subdomain: "givago",
      primaryColor: "#E8A045",
      secondaryColor: "#ffffff",
      whatsapp: "556796921144",
      instagram: "https://www.instagram.com/givagooficial/",
      spotify: "https://open.spotify.com/intl-pt/artist/3guvb3bxPViYo54onCswVL",
      x: "https://twitter.com/twittdogivago",
      youtube: "https://www.youtube.com/@givagooficial7794",
      logoUrl: "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/logo.png",
      basePdfUrl: "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/base.pdf",
      baseContractPdfUrl: "https://pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev/assets/givago/base-contrato.pdf",
      paperWidth: "34.44",
      paperHeight: "48.71",
      instruments: "Bateria, Percussão, Guitarra, Baixo, Sanfona",
      website: "www.givagooficial.com.br",
      legalName: "Victor Givago Barbosa Caneppele",
      cnpj: "43.778.093/0001-92",
      address: {
        rua: "Rua das Folhagens",
        numero: "280",
        bairro: "Carandá Bosque",
        cidade: "Campo Grande",
        estado: "MS"
      },
      bankInfo: {
        titular: "Victor Givago Barbosa Caneppele",
        pix: "CNPJ 43.778.093/0001-92",
        banco: "Inter",
        conta: "22616151-0",
        agencia: "0001"
      },
      status: "ACTIVE",
    },
  });
  console.log(`✔ Artista: ${artist.name} (id: ${artist.id})`);

  // ── ARTIST_ADMIN vinculado ao artista ──────────────────────────────────────
  const artistEmail = "givago@formalize.com";
  const artistPass = "Givago@123";
  const artistHashed = await hash(artistPass, 12);

  const existingArtist = await prisma.user.findFirst({
    where: { email: artistEmail, artistId: artist.id },
  });

  if (existingArtist) {
    await prisma.user.update({
      where: { id: existingArtist.id },
      data: { password: artistHashed, name: "Givago" },
    });
    console.log(`✔ ARTIST_ADMIN atualizado: ${artistEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: artistEmail,
        password: artistHashed,
        name: "Givago",
        role: "ARTIST_ADMIN",
        artistId: artist.id,
      },
    });
    console.log(`✔ ARTIST_ADMIN criado: ${artistEmail}`);
  }

  console.log("");
  console.log("  SUPER_ADMIN  →  admin@formalize.com  /  Admin@123");
  console.log("  ARTIST_ADMIN →  givago@formalize.com /  Givago@123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
