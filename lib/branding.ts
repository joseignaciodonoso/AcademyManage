// Note: Do not rely on the app's generic Academy type; the Prisma model includes branding fields.

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

  // Helpers: HEX -> HSL string "h s% l%"
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '')
    const bigint = Number.parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return { r, g, b }
  }

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  const hexToHslString = (hex: string) => {
    try {
      const { r, g, b } = hexToRgb(hex)
      const { h, s, l } = rgbToHsl(r, g, b)
      return `${h} ${s}% ${l}%`
    } catch {
      return '210 40% 98%'
    }
  }

  const primaryHsl = hexToHslString(theme.primary)
  const secondaryHsl = hexToHslString(theme.secondary)
  const accentHsl = hexToHslString(theme.accent)
  const backgroundHsl = hexToHslString(theme.background)
  const foregroundHsl = hexToHslString(theme.foreground)
  const neutralHsl = hexToHslString(theme.neutral)

  styleElement.textContent = `
    :root[data-academy-id="${academyId}"] {
      ${generateCSSVariables(theme)}
      /* Tailwind design tokens */
      --background: ${backgroundHsl};
      --foreground: ${foregroundHsl};
      --primary: ${primaryHsl};
      --primary-foreground: ${foregroundHsl};
      --secondary: ${secondaryHsl};
      --secondary-foreground: ${foregroundHsl};
      --accent: ${accentHsl};
      --accent-foreground: ${foregroundHsl};
      /* Semantic tokens */
      --success: ${hexToHslString('#16a34a')};
      --success-foreground: ${foregroundHsl};
      --warning: ${hexToHslString('#ca8a04')};
      --warning-foreground: ${foregroundHsl};
      --info: ${accentHsl};
      --info-foreground: ${foregroundHsl};
      --destructive: ${hexToHslString('#dc2626')};
      --destructive-foreground: ${foregroundHsl};
      --muted: ${neutralHsl};
      --muted-foreground: ${foregroundHsl};
      --border: ${neutralHsl};
      --input: ${neutralHsl};
      --ring: ${primaryHsl};
    }

    .dark[data-academy-id="${academyId}"] {
      /* Dark mode now respects academy branding tokens */
      --background: ${backgroundHsl};
      --foreground: ${foregroundHsl};
      --card: ${backgroundHsl};
      --card-foreground: ${foregroundHsl};
      --popover: ${backgroundHsl};
      --popover-foreground: ${foregroundHsl};
      --primary: ${primaryHsl};
      --primary-foreground: ${foregroundHsl};
      --secondary: ${secondaryHsl};
      --secondary-foreground: ${foregroundHsl};
      --muted: ${neutralHsl};
      --muted-foreground: ${foregroundHsl};
      --accent: ${accentHsl};
      --accent-foreground: ${foregroundHsl};
      /* Semantic tokens */
      --success: ${hexToHslString('#16a34a')};
      --success-foreground: ${foregroundHsl};
      --warning: ${hexToHslString('#ca8a04')};
      --warning-foreground: ${foregroundHsl};
      --info: ${accentHsl};
      --info-foreground: ${foregroundHsl};
      --destructive: ${hexToHslString('#dc2626')};
      --destructive-foreground: ${foregroundHsl};
      --border: ${neutralHsl};
      --input: ${neutralHsl};
      --ring: ${primaryHsl};
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

type AcademyBrandingSource = {
  brandPrimary: string
  brandSecondary: string
  brandAccent: string
  brandNeutral: string
  brandBackground: string
  brandForeground: string
  logoUrl?: string | null
  logoDarkUrl?: string | null
  faviconUrl?: string | null
  ogImageUrl?: string | null
  defaultThemeMode: string
}

export function generateBrandingFromAcademy(academy: AcademyBrandingSource): BrandingTheme {
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
