"use client"
import React from "react"

type AnimatedLogoMarkProps = {
    size?: number
    variant?: "orbit" | "prism" | "pulse"
    className?: string
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n))
}

export function AnimatedLogoMark({
    size = 18,
    variant = "orbit",
    className,
}: AnimatedLogoMarkProps) {
    const s = clamp(size, 12, 64)
    const id = `pc-anim-${variant}-${s}`.replace(/[^a-zA-Z0-9-]/g, "")

    if (variant === "pulse") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                className={className}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id={`${id}-g`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="hsl(258,85%,64%)" />
                        <stop offset="1" stopColor="hsl(142,71%,45%)" />
                    </linearGradient>
                </defs>

                <circle
                    cx="12"
                    cy="12"
                    r="9.25"
                    stroke={`url(#${id}-g)`}
                    strokeWidth="1.6"
                    opacity="0.95"
                />
                <path
                    d="M9.2 8.1 17.1 12l-7.9 3.9V8.1Z"
                    fill={`url(#${id}-g)`}
                    opacity="0.98"
                />

                {/* Subtle pulsing halo */}
                <circle cx="12" cy="12" r="9.25" stroke={`url(#${id}-g)`} strokeWidth="1.2" opacity="0.35">
                    <animate
                        attributeName="r"
                        values="9.25;10.6"
                        dur="1.9s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.35;0.06"
                        dur="1.9s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>
        )
    }

    if (variant === "prism") {
        return (
            <svg
                width={s}
                height={s}
                viewBox="0 0 24 24"
                fill="none"
                className={className}
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id={`${id}-g`} x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                        <stop stopColor="hsl(142,71%,45%)" />
                        <stop offset="1" stopColor="hsl(258,85%,64%)" />
                    </linearGradient>
                </defs>

                <path
                    d="M12 2.6 21 7.7v8.6L12 21.4 3 16.3V7.7L12 2.6Z"
                    stroke={`url(#${id}-g)`}
                    strokeWidth="1.4"
                    opacity="0.9"
                />
                <path
                    d="M12 6.7 18.5 10.3v3.4L12 17.3 5.5 13.7v-3.4L12 6.7Z"
                    fill={`url(#${id}-g)`}
                    opacity="0.18"
                />
                {/* Rotating core */}
                <g>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="2.4s"
                        repeatCount="indefinite"
                    />
                    <path d="M12 8.1 15.9 12 12 15.9 8.1 12 12 8.1Z" fill={`url(#${id}-g)`} opacity="0.95" />
                </g>
            </svg>
        )
    }

    // orbit
    return (
        <svg
            width={s}
            height={s}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`${id}-g`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="hsl(258,85%,64%)" />
                    <stop offset="1" stopColor="hsl(142,71%,45%)" />
                </linearGradient>
            </defs>

            <circle cx="12" cy="12" r="8.8" stroke={`url(#${id}-g)`} strokeWidth="1.4" opacity="0.9" />
            <path d="M9.2 8.1 17.1 12l-7.9 3.9V8.1Z" fill={`url(#${id}-g)`} opacity="0.98" />

            {/* Orbiting accent dot */}
            <g>
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1.8s"
                    repeatCount="indefinite"
                />
                <circle cx="16.7" cy="7.4" r="1.05" fill="hsl(142,71%,45%)" opacity="0.95" />
            </g>
        </svg>
    )
}

export const AnimatedStatusDot = ({
    variant = "info",
    size = 10,
    className,
}: {
    variant?: "ok" | "warn" | "locked" | "info"
    size?: number
    className?: string
}) => {
    const map: Record<string, { bg: string; ring: string }> = {
        ok: { bg: "rgba(34,197,94,0.18)", ring: "rgba(34,197,94,0.45)" },
        warn: { bg: "rgba(234,179,8,0.18)", ring: "rgba(234,179,8,0.45)" },
        locked: { bg: "rgba(168,85,247,0.18)", ring: "rgba(168,85,247,0.45)" },
        info: { bg: "rgba(124,58,237,0.18)", ring: "rgba(124,58,237,0.45)" },
    }
    const { bg, ring } = map[variant] ?? map.info

    return (
        <span
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: 999,
                background: bg,
                border: `1px solid ${ring}`,
                display: "inline-block",
                position: "relative",
                overflow: "hidden",
            }}
            aria-hidden="true"
        >
            <span
                style={{
                    position: "absolute",
                    inset: -6,
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 55%)",
                    animation: "pc-dot-shimmer 1.6s ease-in-out infinite",
                }}
            />
            <style>{`
        @keyframes pc-dot-shimmer {
          0% { transform: translateX(-6px); opacity: 0.25; }
          50% { transform: translateX(6px); opacity: 0.45; }
          100% { transform: translateX(-6px); opacity: 0.25; }
        }
      `}</style>
        </span>
    )
}
