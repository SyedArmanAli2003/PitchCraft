import type { Metadata } from "next"
import { Sora } from "next/font/google"
import "./globals.css"

const sora = Sora({
  subsets: ["latin"],
  weight: ["300","400","500","600","700"],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-sora antialiased">
        {children}
      </body>
    </html>
  )
}
