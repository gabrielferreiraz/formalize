export default function DocumentNotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#07090e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px 16px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: "#e8edf5", marginBottom: 10 }}>
          Este link não está disponível
        </h1>
        <p style={{ fontSize: 13, color: "#4b6180", lineHeight: 1.6 }}>
          Pode ter expirado ou o link está incorreto. Fale com quem te enviou pra conseguir um novo.
        </p>
      </div>
    </main>
  );
}
