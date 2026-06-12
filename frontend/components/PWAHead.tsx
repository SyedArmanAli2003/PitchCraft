"use client"

import { useEffect } from "react"

export default function PWAHead() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.log("Service Worker registration failed:", err)
        })
      })
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      localStorage.setItem("pwa-install-prompt", JSON.stringify({ saved: true }))
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener)
    }
  }, [])

  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#7C3AED" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="PitchCraft" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="PitchCraft" />
      <meta name="msapplication-TileColor" content="#7C3AED" />
      <meta name="msapplication-tap-highlight" content="no" />
    </>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}