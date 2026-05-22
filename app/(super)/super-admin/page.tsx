"use client";

import dynamic from "next/dynamic";

// DashboardContent has recharts (ResizeObserver), date formatting, and client
// state — loading it with ssr: false means server never renders it, so there
// is zero chance of a hydration mismatch for this page.
const DashboardContent = dynamic(() => import("./DashboardContent"), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-stage-700/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card h-64 animate-pulse bg-stage-700/50 lg:col-span-2" />
        <div className="card h-64 animate-pulse bg-stage-700/50" />
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardContent />;
}
