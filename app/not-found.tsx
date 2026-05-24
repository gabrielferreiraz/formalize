import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{
      minHeight: "100dvh",
      background: "#07090e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px 16px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: "#1e2535", lineHeight: 1, marginBottom: 8 }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e8edf5", marginBottom: 10 }}>
          Página não encontrada
        </h1>
        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 28, lineHeight: 1.6 }}>
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #f5c842, #d4a017)",
            color: "#07090e",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Ir para o login
        </Link>
      </div>
    </main>
  );
}
