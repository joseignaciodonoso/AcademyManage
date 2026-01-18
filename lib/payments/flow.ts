import crypto from "crypto"

const FLOW_API_URL = process.env.FLOW_ENVIRONMENT === "production" 
  ? "https://www.flow.cl/api" 
  : "https://sandbox.flow.cl/api"

interface FlowPaymentParams {
  commerceOrder: string
  subject: string
  amount: number
  email: string
  urlConfirmation: string
  urlReturn: string
  currency?: string
  optional?: Record<string, string>
}

interface FlowPaymentResponse {
  url: string
  token: string
  flowOrder: number
}

/**
 * Generate Flow signature for API requests
 */
function generateSignature(params: Record<string, string>, secretKey: string): string {
  // Sort params alphabetically by key
  const sortedKeys = Object.keys(params).sort()
  const signString = sortedKeys.map(key => `${key}${params[key]}`).join("")
  
  // Create HMAC-SHA256 signature
  return crypto.createHmac("sha256", secretKey).update(signString).digest("hex")
}

/**
 * Create a payment in Flow
 * @param params Payment parameters
 * @param apiKey Flow API key from academy settings
 * @param secretKey Flow Secret key from academy settings
 */
export async function createFlowPayment(
  params: FlowPaymentParams,
  apiKey: string,
  secretKey: string
): Promise<FlowPaymentResponse> {
  if (!apiKey || !secretKey) {
    throw new Error("Flow API credentials not configured. Configure them in Settings > Payment Methods > Flow")
  }

  const requestParams: Record<string, string> = {
    apiKey,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: params.currency || "CLP",
    amount: String(Math.round(params.amount)),
    email: params.email,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
  }

  // Add optional params if provided
  if (params.optional) {
    Object.entries(params.optional).forEach(([key, value]) => {
      requestParams[`optional_${key}`] = value
    })
  }

  // Generate signature
  const signature = generateSignature(requestParams, secretKey)
  requestParams.s = signature

  // Make request to Flow API
  const formData = new URLSearchParams(requestParams)
  
  const response = await fetch(`${FLOW_API_URL}/payment/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Flow API error:", errorText)
    throw new Error(`Flow API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  if (data.code && data.message) {
    throw new Error(`Flow error ${data.code}: ${data.message}`)
  }

  return {
    url: data.url,
    token: data.token,
    flowOrder: data.flowOrder,
  }
}

/**
 * Get payment status from Flow
 */
export async function getFlowPaymentStatus(token: string): Promise<{
  flowOrder: number
  commerceOrder: string
  status: number
  statusStr: string
  amount: number
  payer: string
  paymentData?: {
    date: string
    media: string
    conversionDate?: string
    conversionRate?: number
    amount?: number
    currency?: string
    fee?: number
    balance?: number
    transferDate?: string
  }
}> {
  const apiKey = process.env.FLOW_API_KEY
  const secretKey = process.env.FLOW_SECRET_KEY

  if (!apiKey || !secretKey) {
    throw new Error("Flow API credentials not configured")
  }

  const requestParams: Record<string, string> = {
    apiKey,
    token,
  }

  const signature = generateSignature(requestParams, secretKey)
  requestParams.s = signature

  const queryString = new URLSearchParams(requestParams).toString()
  
  const response = await fetch(`${FLOW_API_URL}/payment/getStatus?${queryString}`, {
    method: "GET",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Flow API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  // Flow status codes:
  // 1 = Pending
  // 2 = Paid
  // 3 = Rejected
  // 4 = Cancelled
  const statusMap: Record<number, string> = {
    1: "PENDING",
    2: "PAID",
    3: "REJECTED",
    4: "CANCELLED",
  }

  return {
    flowOrder: data.flowOrder,
    commerceOrder: data.commerceOrder,
    status: data.status,
    statusStr: statusMap[data.status] || "UNKNOWN",
    amount: data.amount,
    payer: data.payer,
    paymentData: data.paymentData,
  }
}

/**
 * Verify Flow webhook signature
 */
export function verifyFlowWebhookSignature(
  params: Record<string, string>,
  receivedSignature: string
): boolean {
  const secretKey = process.env.FLOW_SECRET_KEY
  if (!secretKey) return false

  // Remove signature from params for verification
  const paramsWithoutSig = { ...params }
  delete paramsWithoutSig.s

  const expectedSignature = generateSignature(paramsWithoutSig, secretKey)
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  )
}
