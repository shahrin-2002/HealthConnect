export default function Prescription() {
  return (
    <div style={card}>
      <h3>📄 E-Prescription</h3>
      <button style={btn}>Generate QR</button>
      <button style={{ ...btn, marginLeft: 10 }}>Download PDF</button>
      <p style={{ marginTop: 10 }}>
        ✔ QR-based verification supported
      </p>
    </div>
  );
}

const card = { padding: 20, border: "1px solid #ddd", borderRadius: 10 };
const btn = { padding: "8px 14px", background: "#264653", color: "#fff", border: 0, borderRadius: 6 };
