import type { Metadata } from "next"
import type { BusinessPlan } from "@/lib/types"
import { API } from "@/lib/config"
import PlanDisplay from "./PlanDisplay"

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(API.plan(params.id), { cache: "no-store" })
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
  { params }: { params: { id: string } }
) {
  let plan: BusinessPlan | null = null
  try {
    const res = await fetch(API.plan(params.id), { cache: "no-store" })
    if (!res.ok) throw new Error("Not found")
    plan = await res.json()
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(240,25%,4%)" }}>
        <div className="text-center">
          <p className="text-white text-xl mb-2">Plan not found</p>
          <a href="/" className="text-sm" style={{ color: "hsl(258,85%,74%)" }}>
            ← Generate your own
          </a>
        </div>
      </div>
    )
  }
  return <PlanDisplay plan={plan!} />
}
