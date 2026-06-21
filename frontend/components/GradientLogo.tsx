import React from "react"

type LogoMarkProps = {
    size?: number
    className?: string
}

/**
 * PitchCraft mark (lightweight: no SVG blur filters to avoid UI lag).
 * Used in place of emoji UI icons.
 */
export function LogoMark({ size = 18, className }: LogoMarkProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <defs>
                {/* Lightweight gradient (no filters) */}
                <linearGradient id="pc-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="hsl(258,85%,64%)" />
                    <stop offset="1" stopColor="hsl(142,71%,45%)" />
                </linearGradient>
            </defs>

            {/* Outer ring (subtle, premium) */}
            <path
                d="M12 2.5c5.25 0 9.5 4.25 9.5 9.5s-4.25 9.5-9.5 9.5S2.5 17.25 2.5 12 6.75 2.5 12 2.5Z"
                stroke="url(#pc-grad)"
                strokeWidth="1.6"
                opacity="0.9"
            />

            {/* Core mark */}
            <path
                d="M9.2 8.1 17.1 12l-7.9 3.9V8.1Z"
                fill="url(#pc-grad)"
                opacity="0.98"
            />

            {/* Micro accent dot */}
            <circle cx="16.7" cy="7.4" r="1.05" fill="hsl(142,71%,45%)" opacity="0.95" />
        </svg>
    )
}

type StatusDotProps = {
    variant?: "ok" | "warn" | "locked" | "info"
    size?: number
    className?: string
}

/**
 * Minimal status indicator (replaces emoji-like status chips).
 */
export function StatusDot({ variant = "info", size = 10, className }: StatusDotProps) {
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
            }}
            aria-hidden="true"
        />
    )
}
