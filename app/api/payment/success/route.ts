import { NextRequest, NextResponse } from "next/server"

// This endpoint returns a static HTML page for payment callbacks
// It avoids the NextAuth SessionProvider issues by not using React components
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get("provider") || ""
  const status = searchParams.get("status") || "success"
  const paymentId = searchParams.get("paymentId") || ""
  const orgSlug = searchParams.get("orgSlug") || ""

  const isSuccess = status === "success" || status === "paid"
  const isPending = status === "pending"
  
  // Build the correct portal URL with orgSlug if available
  const portalUrl = orgSlug ? `/${orgSlug}/app` : "/app"
  const loginUrl = orgSlug 
    ? `/api/auth/login?callbackUrl=${encodeURIComponent(`/${orgSlug}/app`)}` 
    : "/api/auth/login?callbackUrl=/app"

  const iconClass = isSuccess ? "success" : isPending ? "pending" : "failed"
  const icon = isSuccess ? "✓" : isPending ? "⏳" : "✕"
  
  const title = isSuccess 
    ? "¡Pago confirmado!" 
    : isPending 
      ? "Pago en proceso" 
      : "Pago no completado"

  const description = isSuccess
    ? "Tu pago fue procesado correctamente. Tu membresía ya está activa."
    : isPending
      ? "Tu pago está siendo procesado. Te notificaremos cuando se confirme."
      : "Hubo un problema con tu pago. Intenta nuevamente o usa otro método."

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Resultado del Pago - Academia</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      padding: 2.5rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }
    .icon.success { background: #dcfce7; color: #16a34a; }
    .icon.pending { background: #fef9c3; color: #ca8a04; }
    .icon.failed { background: #fee2e2; color: #dc2626; }
    h1 { 
      font-size: 1.75rem; 
      font-weight: 700; 
      margin-bottom: 1rem;
      color: #1e293b;
    }
    .description { 
      color: #64748b; 
      margin-bottom: 0.75rem;
      line-height: 1.6;
      font-size: 1rem;
    }
    .method {
      color: #475569;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .ref { 
      font-family: 'SF Mono', Monaco, monospace; 
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      display: inline-block;
      margin-top: 0.75rem;
      color: #64748b;
    }
    .buttons { 
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    a {
      display: block;
      padding: 0.875rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
    }
    .btn-primary:hover { 
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.5);
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .btn-secondary:hover { 
      background: #e2e8f0;
    }
    .logo {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🥋</div>
    <div class="icon ${iconClass}">${icon}</div>
    <h1>${title}</h1>
    <p class="description">${description}</p>
    ${provider ? `<p class="method">Método de pago: <strong>${provider.charAt(0).toUpperCase() + provider.slice(1)}</strong></p>` : ''}
    ${paymentId ? `<span class="ref">Ref: ${paymentId}</span>` : ''}
    <div class="buttons">
      <a href="${portalUrl}" class="btn-primary">Ir a mi cuenta</a>
      <a href="${loginUrl}" class="btn-secondary">Iniciar sesión</a>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

// Also handle POST in case Flow sends a POST request
export async function POST(request: NextRequest) {
  return GET(request)
}
