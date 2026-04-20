import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SuperHeader } from "./super-admin/components/SuperHeader";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-stage-900 text-gray-100 font-body">
      <SuperHeader userName={session.user.name ?? "Admin"} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
