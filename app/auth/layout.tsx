"use client"

import { useEffect } from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force default branding colors for auth pages (no academy-specific branding)
  useEffect(() => {
    const root = document.documentElement
    
    // Remove any academy-specific branding
    root.removeAttribute("data-academy-id")
    
    // Remove any injected branding styles
    const brandingStyles = document.querySelectorAll('[id^="branding-"]')
    brandingStyles.forEach(el => el.remove())
    
    // Force light mode for auth pages
    root.classList.remove("dark")
    
    // Apply default blue theme via CSS custom properties
    root.style.setProperty("--primary", "221 83% 53%")
    root.style.setProperty("--primary-foreground", "210 40% 98%")
    root.style.setProperty("--accent", "262 83% 58%")
    root.style.setProperty("--accent-foreground", "210 40% 98%")
    root.style.setProperty("--background", "222 47% 11%")
    root.style.setProperty("--foreground", "213 31% 91%")
    root.style.setProperty("--card", "223 47% 14%")
    root.style.setProperty("--card-foreground", "213 31% 91%")
    root.style.setProperty("--muted", "217 33% 17%")
    root.style.setProperty("--muted-foreground", "215 20% 65%")
    root.style.setProperty("--border", "217 33% 20%")
    root.style.setProperty("--input", "217 33% 20%")
    root.style.setProperty("--ring", "217 91% 60%")
    
    return () => {
      // Cleanup: remove inline styles when leaving auth pages
      root.style.removeProperty("--primary")
      root.style.removeProperty("--primary-foreground")
      root.style.removeProperty("--accent")
      root.style.removeProperty("--accent-foreground")
      root.style.removeProperty("--background")
      root.style.removeProperty("--foreground")
      root.style.removeProperty("--card")
      root.style.removeProperty("--card-foreground")
      root.style.removeProperty("--muted")
      root.style.removeProperty("--muted-foreground")
      root.style.removeProperty("--border")
      root.style.removeProperty("--input")
      root.style.removeProperty("--ring")
    }
  }, [])

  return <>{children}</>
}
