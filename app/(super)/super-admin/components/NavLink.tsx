"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = href === "/super-admin"
    ? pathname === href
    : !!pathname?.startsWith(href);

  return (
    <Link
      href={href}
      // suppressHydrationWarning: server and client may compute different
      // active classes since usePathname() can diverge during hydration.
      // Element structure (<a>) is always present on both — only className differs.
      suppressHydrationWarning
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-gold-500 text-stage-900"
          : "text-gray-400 hover:text-gray-200 hover:bg-stage-700/50"
      }`}
    >
      {children}
    </Link>
  );
}
