/**
 * PitchCraft auth client — talks to the MongoDB-backed auth endpoints on the
 * FastAPI backend (no third-party BaaS). The session is a signed token stored
 * in localStorage alongside a small public user profile.
 *
 *   localStorage "pitchcraft_user" = { name, email, initials, id, accessToken }
 *
 * The same `id` is reused as the device/account scope for plan history and the
 * HydraDB brain, so a logged-in user's plans follow their account.
 */
import { API } from "@/lib/config"

export interface AuthUser {
  id: string
  name: string
  email: string
  initials: string
  accessToken: string
}

interface ApiUser { id?: string; email?: string; name?: string }

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function saveUserLocally(user: ApiUser, accessToken: string): AuthUser {
  const name = user.name || user.email?.split("@")[0] || "User"
  const data: AuthUser = {
    id: user.id || "",
    name,
    email: user.email || "",
    initials: initialsOf(name),
    accessToken,
  }
  try { localStorage.setItem("pitchcraft_user", JSON.stringify(data)) } catch { /* ignore */ }
  return data
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("pitchcraft_user")
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return getStoredUser()?.accessToken || null
}

export function signOut(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("pitchcraft_user")
    localStorage.removeItem("pitchcraft_user_id")
    localStorage.removeItem("pitchcraft_plan_ids")
  } catch { /* ignore */ }
}

async function postAuth(url: string, body: Record<string, unknown>): Promise<AuthUser> {
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error("Couldn't reach the server — please try again.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.detail || `Request failed (${res.status})`)
  }
  if (!data?.token || !data?.user) {
    throw new Error("Unexpected response from server.")
  }
  return saveUserLocally(data.user, data.token)
}

export async function signUp(email: string, password: string, name: string): Promise<AuthUser> {
  return postAuth(API.authSignup, { email, password, name })
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  return postAuth(API.authLogin, { email, password })
}

/** Validate the stored token against the backend. Returns null if invalid. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const stored = getStoredUser()
  if (!stored?.accessToken) return null
  try {
    const res = await fetch(API.authMe, {
      headers: { Authorization: `Bearer ${stored.accessToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.user) return null
    return saveUserLocally(data.user, stored.accessToken)
  } catch {
    return stored // offline: trust the local copy rather than logging the user out
  }
}
