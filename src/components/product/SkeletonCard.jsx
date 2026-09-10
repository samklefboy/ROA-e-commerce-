// ---- SKELETON CARD ----
export default function SkeletonCard() {
  return (
    <div
      style={{
        background: "#111a11",
        border: "0.5px solid #1a2a1a",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1/1",
          background: "#1a2a1a",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <div style={{ padding: 10 }}>
        <div
          style={{
            height: 10,
            background: "#1a2a1a",
            borderRadius: 5,
            marginBottom: 8,
            width: "60%",
          }}
        />
        <div
          style={{
            height: 12,
            background: "#1a2a1a",
            borderRadius: 5,
            marginBottom: 6,
          }}
        />
        <div
          style={{
            height: 12,
            background: "#1a2a1a",
            borderRadius: 5,
            marginBottom: 8,
            width: "80%",
          }}
        />
        <div style={{ height: 28, background: "#1a2a1a", borderRadius: 8 }} />
      </div>
    </div>
  );
}
