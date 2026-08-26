import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveDocumentHtml } from "@/lib/documents/render-html";
import { DocumentFrame } from "./DocumentFrame";

export const dynamic = "force-dynamic";

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const doc = await prisma.document.findUnique({
    where: { publicToken: token },
    select: { id: true, type: true, title: true, data: true, artistId: true },
  });
  if (!doc) notFound();

  const html = await resolveDocumentHtml(doc.artistId, doc.type, doc.data as Record<string, unknown>);
  if (!html) notFound();

  return (
    <div style={{ minHeight: "100dvh", background: "#0e1118", display: "flex", flexDirection: "column" }}>
      <DocumentFrame html={html} token={token} title={doc.title} />
    </div>
  );
}
