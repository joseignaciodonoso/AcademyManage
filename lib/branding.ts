import type { Academy } from "@/lib/types"

export interface BrandingTheme {
  primary: string
  secondary: string
  accent: string
  neutral: string
  background: string
  foreground: string
  logoUrl?: string
  logoDarkUrl?: string
  faviconUrl?: string
  ogImageUrl?: string
  defaultThemeMode: "light" | "dark" | "system"
}

export function generateCSSVariables(theme: BrandingTheme): string {
  return `
    --brand-primary: ${theme.primary};
    --brand-secondary: ${theme.secondary};
    --brand-accent: ${theme.accent};
    --brand-neutral: ${theme.neutral};
    --brand-background: ${theme.background};
    --brand-foreground: ${theme.foreground};
  `
}

export function applyBrandingToDocument(academyId: string, theme: BrandingTheme): void {
  if (typeof document === "undefined") return

  // Set data attribute for academy-specific styling
  document.documentElement.setAttribute("data-academy-id", academyId)

  // Inject CSS variables
  const styleId = `branding-${academyId}`
  let styleElement = document.getElementById(styleId) as HTMLStyleElement

  if (!styleElement) {
    styleElement = document.createElement("style")
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }

  styleElement.textContent = `
    :root[data-academy-id="${academyId}"] {
      ${generateCSSVariables(theme)}
      --color-primary: var(--brand-primary);
      --color-secondary: var(--brand-secondary);
      --color-accent: var(--brand-accent);
      --color-background: var(--brand-background);
      --color-foreground: var(--brand-foreground);
    }
  `
}

export function checkContrastRatio(foreground: string, background: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)

  if (!fgRgb || !bgRgb) return 0

  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b)
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)

  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

export function getContrastRecommendation(ratio: number): {
  level: "fail" | "aa" | "aaa"
  message: string
  suggestion?: string
} {
  if (ratio >= 7) {
    return { level: "aaa", message: "Excelente contraste (AAA)" }
  } else if (ratio >= 4.5) {
    return { level: "aa", message: "Buen contraste (AA)" }
  } else {
    return {
      level: "fail",
      message: "Contraste insuficiente",
      suggestion: "Usa colores más contrastantes para mejorar la accesibilidad",
    }
  }
}

export function generateBrandingFromAcademy(academy: Academy): BrandingTheme {
  return {
    primary: academy.brandPrimary,
    secondary: academy.brandSecondary,
    accent: academy.brandAccent,
    neutral: academy.brandNeutral,
    background: academy.brandBackground,
    foreground: academy.brandForeground,
    logoUrl: academy.logoUrl || undefined,
    logoDarkUrl: academy.logoDarkUrl || undefined,
    faviconUrl: academy.faviconUrl || undefined,
    ogImageUrl: academy.ogImageUrl || undefined,
    defaultThemeMode: academy.defaultThemeMode as "light" | "dark" | "system",
  }
}
