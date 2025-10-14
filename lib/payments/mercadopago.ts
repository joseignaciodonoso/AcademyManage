type CreatePrefArgs = {
  plan: { id: string; name: string; price: number; currency?: string }
  paymentId: string
  baseUrl: string
  userId?: string
}

export async function createMercadoPagoPreference({ plan, paymentId, baseUrl, userId }: CreatePrefArgs) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error("Mercado Pago no configurado")

  const body = {
    items: [
      {
        title: plan.name,
        quantity: 1,
        currency_id: plan.currency || "CLP",
        unit_price: Number(plan.price),
      },
    ],
    metadata: { paymentId, userId, planId: plan.id },
    external_reference: paymentId,
    back_urls: {
      success: `${baseUrl}/app/subscribe/success?provider=mercadopago&status=success&paymentId=${paymentId}`,
      pending: `${baseUrl}/app/subscribe/success?provider=mercadopago&status=pending&paymentId=${paymentId}`,
      failure: `${baseUrl}/app/subscribe/success?provider=mercadopago&status=failure&paymentId=${paymentId}`,
    },
    auto_return: "approved",
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText
    throw new Error(`Mercado Pago error: ${msg}`)
  }
  // data.init_point is for redirect web, sandbox_init_point in sandbox.
  return { init_point: data.init_point || data.sandbox_init_point }
}

export async function getMercadoPagoPayment(paymentId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error("Mercado Pago no configurado")
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || data?.error || "Error consultando pago MP")
  return data
}

export async function getMercadoPagoMerchantOrder(orderId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error("Mercado Pago no configurado")
  const res = await fetch(`https://api.mercadopago.com/merchant_orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || data?.error || "Error consultando merchant order MP")
  return data
}
