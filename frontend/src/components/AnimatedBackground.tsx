export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">

      {/* Base dark background */}
      <div className="absolute inset-0" style={{ background: "hsl(240,25%,4%)" }} />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(240,12%,35%) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Orb 1 — large purple, top-right */}
      <div
        className="absolute rounded-full orb-1"
        style={{
          width: "700px",
          height: "700px",
          top: "-15%",
          right: "-10%",
          background: "hsl(258,90%,66%)",
          opacity: 0.07,
          filter: "blur(90px)",
          willChange: "transform",
        }}
      />

      {/* Orb 2 — mid cyan, bottom-right */}
      <div
        className="absolute rounded-full orb-2"
        style={{
          width: "450px",
          height: "450px",
          bottom: "5%",
          right: "15%",
          background: "hsl(195,100%,50%)",
          opacity: 0.04,
          filter: "blur(80px)",
          willChange: "transform",
        }}
      />

      {/* Orb 3 — small purple, center */}
      <div
        className="absolute rounded-full orb-3"
        style={{
          width: "320px",
          height: "320px",
          top: "35%",
          right: "40%",
          background: "hsl(258,90%,66%)",
          opacity: 0.05,
          filter: "blur(70px)",
          willChange: "transform",
        }}
      />

      {/* Bottom vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, hsl(240,25%,4%) 0%, transparent 50%)",
        }}
      />

    </div>
  );
}
