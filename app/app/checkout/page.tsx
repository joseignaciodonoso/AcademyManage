import { redirect } from "next/navigation"

export default function CheckoutRedirect({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const qs = new URLSearchParams()
  Object.entries(searchParams || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((x) => qs.append(k, x))
    } else if (v != null) {
      qs.append(k, String(v))
    }
  })
  redirect(`/app/subscribe${qs.toString() ? `?${qs.toString()}` : ""}`)
}
