import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveDocumentHtml } from "@/lib/documents/render-html";
import { logger } from "@/lib/logger";
import { DocumentFrame } from "./DocumentFrame";

export const dynamic = "force-dynamic";

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Só a consulta ao banco é envolvida em try/catch — notFound() lança um
  // erro de controle interno do Next.js que não pode ser engolido aqui.
  const doc = await prisma.document
    .findUnique({
      where: { publicToken: token },
      select: { id: true, type: true, title: true, data: true, artistId: true },
    })
    .catch((err) => {
      logger.error({ err, token, action: "document.public.lookup" }, "falha ao buscar documento público");
      return null;
    });
  if (!doc) notFound();

  // resolveDocumentHtml nunca lança — falha vira null, tratado como 404.
  const html = await resolveDocumentHtml(doc.artistId, doc.type, doc.data as Record<string, unknown>);
  if (!html) notFound();

  return (
    <div style={{ minHeight: "100dvh", background: "#0e1118", display: "flex", flexDirection: "column" }}>
      <DocumentFrame html={html} token={token} title={doc.title} />
    </div>
  );
}
