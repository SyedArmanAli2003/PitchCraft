/**
 * Device-scoped user identity — persisted in localStorage.
 * No authentication: this is a fingerprint-style UUID that lets us
 * scope the plan history to the current browser session/device.
 * 
 * Key: "pitchcraft_user_id"
 * Value: a stable UUID v4 generated once per browser profile.
 */

const USER_ID_KEY = "pitchcraft_user_id"

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Returns the persistent device-scoped user ID.
 * Creates and saves one if it doesn't exist yet.
 * Returns null if called server-side (no localStorage).
 */
export function getUserId(): string | null {
  if (typeof window === "undefined") return null
  try {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
      id = generateUUID()
      localStorage.setItem(USER_ID_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

/**
 * Clear the current user's local identity.
 * Effectively "logs out" — a new ID will be generated on next load.
 */
export function clearUserId(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(USER_ID_KEY)
    localStorage.removeItem("pitchcraft_plan_ids")
  } catch { /* ignore */ }
}
