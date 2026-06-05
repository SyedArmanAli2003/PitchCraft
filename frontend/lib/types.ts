export type StepStatus = "waiting" | "running" | "complete" | "error"

export interface AgentStep {
  stepNumber: number
  name: string
  status: StepStatus
  data?: Record<string, unknown>
  startedAt?: number
  completedAt?: number
  tool: "gemini" | "llama" | "deepseek" | "minimax" | "mongodb" | "system"
}

export interface BusinessPlan {
  _id: string
  idea: string
  created_at: string
  status: "generating" | "complete" | "failed"
  share_token?: string
  validation?: {
    viable: boolean
    viability_score: number
    one_line_summary: string
    target_market: string
    main_concerns: string[]
    core_problem_solved: string
  }
  market_research?: {
    market_size: string
    growth_rate: string
    top_competitors: Array<{ name: string; weakness: string }>
    market_gap: string
    opportunity_score: number
  }
  personas?: Array<{
    name: string
    age: string
    job: string
    pain_point: string
    willingness_to_pay: string
    how_they_find_us: string
  }>
  business_plan?: {
    problem: string
    solution: string
    unique_value_proposition: string
    revenue_model: string
    revenue_streams: string[]
    go_to_market: string
  }
  financials?: {
    year1_revenue: string
    year2_revenue: string
    year3_revenue: string
    startup_cost: string
    monthly_burn: string
    break_even_month: number
    funding_needed: string
  }
  risks?: {
    risks: Array<{ risk: string; severity: "High"|"Medium"|"Low"; mitigation: string }>
    swot: {
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
      threats: string[]
    }
  }
}
