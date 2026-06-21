import type { Metadata, Viewport } from "next"
import { Sora } from "next/font/google"
import "./globals.css"
import PWAHead from "@/components/PWAHead"
import ChatBot from "@/components/ChatBot"

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PitchCraft — AI Business Plan Agent",
  description: "Turn your startup idea into an investor-ready business plan in 60 seconds.",
  openGraph: {
    title: "PitchCraft",
    description: "7-step AI agent. One idea in. Full plan out.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PitchCraft",
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#7C3AED",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={sora.variable}>
      <head>
        <PWAHead />
      </head>
      <body className="font-sora antialiased">
        {children}
        <ChatBot />
      </body>
    </html>
  )
}