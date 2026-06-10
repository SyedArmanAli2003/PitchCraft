export type StepStatus = "waiting" | "running" | "complete" | "error"

export interface AuditStep {
  step_number: number
  step_name: string
  hash: string
  previous_hash: string
  timestamp_utc: string
}

export interface AuditChain {
  plan_id: string
  chain: AuditStep[]
  verified: boolean
  generated_at: string
}

export type GeminiTool =
  | "gemini-3-flash-preview"
  | "gemini-3.1-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-3.5-flash"
  | "gemini-3.1-pro"
  | "gemini-2.5-pro"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash"

export interface AgentStep {
  stepNumber: number
  name: string
  status: StepStatus
  data?: Record<string, unknown>
  startedAt?: number
  completedAt?: number
  tool: GeminiTool | "mongodb" | "system"
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
    location?: string
    income_level?: string
    pain_point: string
    willingness_to_pay: string
    how_they_find_us?: string
    behavior_patterns?: string[]
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
    risks: Array<{ risk: string; severity: "High" | "Medium" | "Low"; mitigation: string }>
    swot: {
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
      threats: string[]
    }
  }
}
