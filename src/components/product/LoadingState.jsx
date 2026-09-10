// ---- LOADING STATE ----
export default function LoadingState() {
  return (
    <div style={{ background: "#0a1a0a", minHeight: "100vh" }}>
      {/* Image skeleton */}
      <div
        style={{
          width: "100%",
          aspectRatio: "4/3",
          background: "#111a11",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <div style={{ padding: 16 }}>
        {/* Text skeletons */}
        {[140, 200, 100, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 0 ? 24 : i === 1 ? 32 : 16,
              width: w,
              background: "#111a11",
              borderRadius: 6,
              marginBottom: 12,
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}
