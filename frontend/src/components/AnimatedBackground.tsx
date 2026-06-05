export default function AnimatedBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: "hsl(240, 25%, 4%)" }}
    >
      {/* Orb 1 — large purple, top-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          top: "-10%",
          right: "-5%",
          background: "hsl(258, 90%, 66%)",
          opacity: 0.12,
          filter: "blur(80px)",
          willChange: "transform",
          animation: "float1 8s ease-in-out infinite alternate",
        }}
      />

      {/* Orb 2 — medium cyan, bottom-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          bottom: "10%",
          right: "20%",
          background: "hsl(195, 100%, 50%)",
          opacity: 0.04,
          filter: "blur(80px)",
          willChange: "transform",
          animation: "float2 10s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* Orb 3 — small purple, center-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          top: "30%",
          right: "35%",
          background: "hsl(258, 90%, 66%)",
          opacity: 0.05,
          filter: "blur(80px)",
          willChange: "transform",
          animation: "float3 12s ease-in-out infinite alternate",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsla(240,20%,6%,0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(240,20%,6%,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.15,
        }}
      />
    </div>
  );
}
