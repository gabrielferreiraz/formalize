"use client";
import { useEffect } from "react";

export function ForceRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#07090e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: "3px solid rgba(255,255,255,0.08)",
        borderTopColor: "#e6b800",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
