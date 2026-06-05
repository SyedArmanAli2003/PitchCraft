import { useState, useEffect } from "react"
import { ENDPOINTS } from "../config"

interface HealthCheckResult {
  isOnline: boolean
  isChecking: boolean
}

export function useHealthCheck(): HealthCheckResult {
  const [isOnline, setIsOnline] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      try {
        const res = await fetch(ENDPOINTS.health, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!cancelled) {
          setIsOnline(res.ok)
        }
      } catch {
        if (!cancelled) {
          setIsOnline(false)
        }
      } finally {
        clearTimeout(timeout)
        if (!cancelled) {
          setIsChecking(false)
        }
      }
    }

    check()

    return () => {
      cancelled = true
    }
  }, [])

  return { isOnline, isChecking }
}
