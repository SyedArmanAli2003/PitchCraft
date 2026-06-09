import type { Metadata } from "next"
import type { BusinessPlan } from "@/lib/types"
import PlanDisplay from "./PlanDisplay"

// Server components can't use relative URLs for fetch.
// In production on Vercel, VERCEL_URL is auto-set (e.g. "my-app.vercel.app").
// In development, the backend runs on localhost:8000 via Next.js proxy.
function serverApiBase(): string {
  if (process.env.NODE_ENV === "production") {
    const host = process.env.VERCEL_URL || process.env.FRONTEND_URL || ""
    return host ? `https://${host}` : ""
  }
  return "http://localhost:8000"
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(`${serverApiBase()}/api/plan/${id}`, { cache: "no-store" })
    const plan: BusinessPlan = await res.json()
    return {
      title: `${plan.validation?.one_line_summary || plan.idea} — PitchCraft`,
      description: `AI-generated business plan: ${plan.idea}`,
    }
  } catch {
    return { title: "Business Plan — PitchCraft" }
  }
}

export default async function PlanPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let plan: BusinessPlan | null = null

  try {
    const res = await fetch(`${serverApiBase()}/api/plan/${id}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Not found")
    plan = await res.json()
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(240,25%,4%)" }}>
        <div className="text-center">
          <p className="text-white text-xl mb-2">Plan not found</p>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            The plan may still be generating — try refreshing in a moment.
          </p>
          <a href="/generate" className="text-sm" style={{ color: "hsl(258,85%,74%)" }}>
            ← Generate your own
          </a>
        </div>
      </div>
    )
  }

  return <PlanDisplay plan={plan!} />
}
