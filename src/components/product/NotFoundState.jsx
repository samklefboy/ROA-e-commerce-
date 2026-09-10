import { FaSadTear } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// ---- NOT FOUND STATE ----
export default function NotFoundState() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        background: "#0a1a0a",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <FaSadTear
          style={{
            fontSize: 48,
            color: "rgba(255,255,255,0.1)",
            display: "block",
            marginBottom: 14,
          }}
        />
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.3)",
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          Product not found
        </p>
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.2)",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          This listing may have been removed or is no longer available.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              fontSize: 13,
              color: "#888",
              cursor: "pointer",
            }}
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            style={{
              padding: "10px 20px",
              background: "#c9a84c",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              color: "#1a1000",
              cursor: "pointer",
            }}
          >
            Browse products
          </button>
        </div>
      </div>
    </div>
  );
}
