import { z } from "zod"

// Odoo Configuration Schema
const OdooConfigSchema = z.object({
  baseUrl: z.string().url(),
  database: z.string(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
})

export type OdooConfig = z.infer<typeof OdooConfigSchema>

// Odoo API Response Types
export interface OdooAcquirer {
  id: number
  name: string
  provider: string
  state: "enabled" | "disabled" | "test"
  company_id: number[]
  journal_id: number[]
  payment_icon_ids: number[]
}

export interface OdooPaymentLink {
  checkoutUrl: string
  externalRef: string
  transactionId?: number
}

export interface OdooTransactionStatus {
  id: number
  reference: string
  state: "draft" | "pending" | "authorized" | "done" | "cancel" | "error"
  amount: number
  currency_id: number[]
  partner_id: number[]
  acquirer_id: number[]
  payment_token_id?: number[]
}

export interface OdooPartner {
  id: number
  name: string
  email: string
  phone?: string
  is_company: boolean
  x_external_id?: string
}

export interface OdooSubscription {
  id: number
  code: string
  partner_id: number[]
  template_id: number[]
  state: "draft" | "in_progress" | "to_renew" | "close"
  recurring_next_date: string
  recurring_total: number
  x_external_id?: string
}

export interface OdooProduct {
  id: number
  name: string
  list_price: number
  recurring_rule_type: "daily" | "weekly" | "monthly" | "yearly"
  is_subscription: boolean
  x_external_id?: string
}

export class OdooConnector {
  private config: OdooConfig
  private sessionId?: string
  private uid?: number

  constructor(config: OdooConfig) {
    this.config = OdooConfigSchema.parse(config)
  }

  // Authentication Methods
  async authenticate(): Promise<void> {
    if (this.config.clientId && this.config.clientSecret) {
      // TODO: Implement OAuth authentication
      throw new Error("OAuth authentication not yet implemented")
    } else if (this.config.username && this.config.password) {
      await this.authenticateXmlRpc()
    } else {
      throw new Error("No valid authentication credentials provided")
    }
  }

  private async authenticateXmlRpc(): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/web/session/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            db: this.config.database,
            login: this.config.username,
            password: this.config.password,
          },
          id: Math.random(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(`Odoo authentication failed: ${data.error.message}`)
      }

      this.sessionId = data.result.session_id
      this.uid = data.result.uid
    } catch (error) {
      throw new Error(`Failed to authenticate with Odoo: ${error}`)
    }
  }

  // Generic RPC Call Method
  public async rpcCall(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    if (!this.sessionId || !this.uid) {
      await this.authenticate()
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/web/dataset/call_kw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${this.sessionId}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            model,
            method,
            args,
            kwargs,
          },
          id: Math.random(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(`Odoo RPC call failed: ${data.error.message}`)
      }

      return data.result
    } catch (error) {
      throw new Error(`RPC call to ${model}.${method} failed: ${error}`)
    }
  }

  // Payment Acquirer Methods
  async listActiveAcquirers(): Promise<OdooAcquirer[]> {
    try {
      const acquirers = await this.rpcCall(
        "payment.acquirer",
        "search_read",
        [[["state", "in", ["enabled", "test"]]]],
        {
          fields: ["name", "provider", "state", "company_id", "journal_id", "payment_icon_ids"],
        },
      )

      return acquirers as OdooAcquirer[]
    } catch (error) {
      console.error("Error fetching active acquirers:", error)
      return []
    }
  }

  // Partner (Customer) Management
  async ensurePartner(partnerData: {
    name: string
    email: string
    phone?: string
    externalId: string
  }): Promise<number> {
    try {
      // First, try to find existing partner by external ID
      const existingPartners = await this.rpcCall(
        "res.partner",
        "search_read",
        [[["x_external_id", "=", partnerData.externalId]]],
        { fields: ["id"] },
      )

      if (existingPartners.length > 0) {
        return existingPartners[0].id
      }

      // Create new partner
      const partnerId = await this.rpcCall("res.partner", "create", [
        {
          name: partnerData.name,
          email: partnerData.email,
          phone: partnerData.phone,
          is_company: false,
          x_external_id: partnerData.externalId,
        },
      ])

      return partnerId
    } catch (error) {
      throw new Error(`Failed to ensure partner: ${error}`)
    }
  }

  // Product/Plan Management
  async ensureProduct(productData: {
    name: string
    price: number
    recurringRuleType: "monthly" | "yearly"
    externalId: string
  }): Promise<number> {
    try {
      // First, try to find existing product by external ID
      const existingProducts = await this.rpcCall(
        "product.product",
        "search_read",
        [[["x_external_id", "=", productData.externalId]]],
        { fields: ["id"] },
      )

      if (existingProducts.length > 0) {
        return existingProducts[0].id
      }

      // Create new product
      const productId = await this.rpcCall("product.product", "create", [
        {
          name: productData.name,
          list_price: productData.price,
          recurring_rule_type: productData.recurringRuleType,
          is_subscription: true,
          x_external_id: productData.externalId,
        },
      ])

      return productId
    } catch (error) {
      throw new Error(`Failed to ensure product: ${error}`)
    }
  }

  // Subscription Management
  async ensureSubscription(subscriptionData: {
    partnerId: number
    templateId: number
    externalId: string
  }): Promise<number> {
    try {
      // First, try to find existing subscription by external ID
      const existingSubscriptions = await this.rpcCall(
        "sale.subscription",
        "search_read",
        [[["x_external_id", "=", subscriptionData.externalId]]],
        { fields: ["id"] },
      )

      if (existingSubscriptions.length > 0) {
        return existingSubscriptions[0].id
      }

      // Create new subscription
      const subscriptionId = await this.rpcCall("sale.subscription", "create", [
        {
          partner_id: subscriptionData.partnerId,
          template_id: subscriptionData.templateId,
          x_external_id: subscriptionData.externalId,
        },
      ])

      return subscriptionId
    } catch (error) {
      throw new Error(`Failed to ensure subscription: ${error}`)
    }
  }

  // Invoice Management
  async ensureInvoice(invoiceData: {
    partnerId: number
    amount: number
    description: string
    externalId: string
  }): Promise<number> {
    try {
      // First, try to find existing invoice by external ID
      const existingInvoices = await this.rpcCall(
        "account.move",
        "search_read",
        [[["x_external_id", "=", invoiceData.externalId]]],
        { fields: ["id"] },
      )

      if (existingInvoices.length > 0) {
        return existingInvoices[0].id
      }

      // Create new invoice
      const invoiceId = await this.rpcCall("account.move", "create", [
        {
          partner_id: invoiceData.partnerId,
          move_type: "out_invoice",
          invoice_line_ids: [
            [
              0,
              0,
              {
                name: invoiceData.description,
                price_unit: invoiceData.amount,
                quantity: 1,
              },
            ],
          ],
          x_external_id: invoiceData.externalId,
        },
      ])

      // Post the invoice
      await this.rpcCall("account.move", "action_post", [[invoiceId]])

      return invoiceId
    } catch (error) {
      throw new Error(`Failed to ensure invoice: ${error}`)
    }
  }

  // Payment Link Creation
  async createPaymentLink(args: {
    docType: "subscription" | "invoice"
    docId: number
    amount: number
    currency: string
    externalRef: string
    returnUrl: string
    cancelUrl: string
    acquirerId?: number
  }): Promise<OdooPaymentLink> {
    try {
      // Create payment transaction
      const transactionId = await this.rpcCall("payment.transaction", "create", [
        {
          reference: args.externalRef,
          amount: args.amount,
          currency_id: await this.getCurrencyId(args.currency),
          partner_id: await this.getDocumentPartnerId(args.docType, args.docId),
          acquirer_id: args.acquirerId || (await this.getDefaultAcquirerId()),
          return_url: args.returnUrl,
          cancel_url: args.cancelUrl,
          // Link to document
          ...(args.docType === "subscription" && { subscription_id: args.docId }),
          ...(args.docType === "invoice" && { invoice_ids: [[6, 0, [args.docId]]] }),
        },
      ])

      // Generate payment link
      const paymentLink = await this.rpcCall("payment.transaction", "get_portal_url", [transactionId])

      return {
        checkoutUrl: paymentLink,
        externalRef: args.externalRef,
        transactionId,
      }
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error}`)
    }
  }

  // Transaction Status
  async getTransactionStatus(externalRef: string): Promise<OdooTransactionStatus | null> {
    try {
      const transactions = await this.rpcCall(
        "payment.transaction",
        "search_read",
        [[["reference", "=", externalRef]]],
        {
          fields: ["reference", "state", "amount", "currency_id", "partner_id", "acquirer_id", "payment_token_id"],
        },
      )

      if (transactions.length === 0) {
        return null
      }

      return transactions[0] as OdooTransactionStatus
    } catch (error) {
      console.error("Error fetching transaction status:", error)
      return null
    }
  }

  // Helper Methods
  private async getCurrencyId(currencyCode: string): Promise<number> {
    const currencies = await this.rpcCall("res.currency", "search_read", [[["name", "=", currencyCode]]], {
      fields: ["id"],
    })

    if (currencies.length === 0) {
      throw new Error(`Currency ${currencyCode} not found`)
    }

    return currencies[0].id
  }

  private async getDocumentPartnerId(docType: string, docId: number): Promise<number> {
    const model = docType === "subscription" ? "sale.subscription" : "account.move"
    const docs = await this.rpcCall(model, "read", [[docId]], { fields: ["partner_id"] })

    if (docs.length === 0) {
      throw new Error(`Document ${docType} with ID ${docId} not found`)
    }

    return docs[0].partner_id[0]
  }

  private async getDefaultAcquirerId(): Promise<number> {
    const acquirers = await this.listActiveAcquirers()

    if (acquirers.length === 0) {
      throw new Error("No active payment acquirers found")
    }

    return acquirers[0].id
  }
}

// Factory function to create Odoo connector
export function createOdooConnector(academyId: string): OdooConnector {
  // TODO: Fetch academy-specific Odoo configuration from database
  const config: OdooConfig = {
    baseUrl: process.env.ODOO_BASE_URL || "",
    database: process.env.ODOO_DB || "",
    clientId: process.env.ODOO_CLIENT_ID,
    clientSecret: process.env.ODOO_CLIENT_SECRET,
    username: process.env.ODOO_USERNAME,
    password: process.env.ODOO_PASSWORD,
  }

  return new OdooConnector(config)
}
