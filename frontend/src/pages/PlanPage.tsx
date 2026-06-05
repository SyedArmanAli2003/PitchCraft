import { useParams } from "react-router-dom";

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div
      className="min-h-screen flex items-center justify-center font-sora"
      style={{ backgroundColor: "hsl(240,25%,4%)" }}
    >
      <div className="text-center">
        <p className="text-primary text-4xl mb-4">✦</p>
        <h1 className="text-2xl font-bold text-foreground mb-2">Full Plan</h1>
        <p className="text-muted-foreground text-sm">Plan ID: {id}</p>
        <p className="text-muted-foreground text-xs mt-2 opacity-50">
          Coming soon — full plan view
        </p>
      </div>
    </div>
  );
}
