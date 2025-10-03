import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createOdooConnector } from "@/lib/odoo/connector"
import { hasPermission } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Check permissions - allow any authenticated user to read plans
    // if (!hasPermission(session.user.role, "plans:read")) {
    //   return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    // }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    // Get Odoo connector
    const odooConnector = createOdooConnector(academyId)

    // Fetch subscription templates from Odoo
    const subscriptionTemplates = await odooConnector.rpcCall(
      "sale.subscription.template",
      "search_read",
      [[]],
      {
        fields: [
          "id",
          "name", 
          "description",
          "recurring_rule_type",
          "recurring_interval",
          "subscription_template_line_ids"
        ]
      }
    )

    // Get product details for each template
    const plansWithProducts = await Promise.all(
      subscriptionTemplates.map(async (template: any) => {
        if (template.subscription_template_line_ids.length > 0) {
          // Get the first product line
          const templateLines = await odooConnector.rpcCall(
            "sale.subscription.template.line",
            "search_read",
            [[["id", "in", template.subscription_template_line_ids]]],
            { fields: ["product_id", "price_unit"] }
          )

          if (templateLines.length > 0) {
            const productId = templateLines[0].product_id[0]
            const price = templateLines[0].price_unit

            // Get product details
            const products = await odooConnector.rpcCall(
              "product.template",
              "search_read",
              [[["id", "=", productId]]],
              { fields: ["name", "description", "list_price"] }
            )

            if (products.length > 0) {
              const product = products[0]
              
              return {
                id: `odoo_${template.id}`,
                odooId: template.id,
                name: template.name || product.name,
                description: template.description || product.description || "",
                price: price || product.list_price,
                currency: "CLP", // Default currency
                type: template.recurring_rule_type === "monthly" ? "MONTHLY" : 
                      template.recurring_rule_type === "yearly" ? "YEARLY" : "MONTHLY",
                interval: template.recurring_interval || 1,
                isActive: true,
                source: "odoo"
              }
            }
          }
        }

        // Fallback if no product lines
        return {
          id: `odoo_${template.id}`,
          odooId: template.id,
          name: template.name,
          description: template.description || "",
          price: 0,
          currency: "CLP",
          type: template.recurring_rule_type === "monthly" ? "MONTHLY" : 
                template.recurring_rule_type === "yearly" ? "YEARLY" : "MONTHLY",
          interval: template.recurring_interval || 1,
          isActive: true,
          source: "odoo"
        }
      })
    )

    return NextResponse.json({
      plans: plansWithProducts,
      total: plansWithProducts.length
    })

  } catch (error) {
    console.error("Error fetching plans from Odoo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(session.user.role, "plans:write")) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const academyId = session.user.academyId
    if (!academyId) {
      return NextResponse.json({ error: "Academia no encontrada" }, { status: 400 })
    }

    const { name, description, price, currency = "CLP", type, interval = 1 } = await request.json()

    // Validate required fields
    if (!name || !price || !type) {
      return NextResponse.json({ error: "Campos requeridos: name, price, type" }, { status: 400 })
    }

    // Get Odoo connector
    const odooConnector = createOdooConnector(academyId)

    // Create product in Odoo first
    const productId = await odooConnector.rpcCall(
      "product.template",
      "create",
      [{
        name,
        description: description || "",
        list_price: price,
        type: "service",
        recurring_invoice: true,
        subscription_template: true
      }]
    )

    // Create subscription template
    const templateId = await odooConnector.rpcCall(
      "sale.subscription.template",
      "create",
      [{
        name,
        description: description || "",
        recurring_rule_type: type.toLowerCase(),
        recurring_interval: interval,
        subscription_template_line_ids: [[0, 0, {
          product_id: productId,
          price_unit: price,
          quantity: 1
        }]]
      }]
    )

    return NextResponse.json({
      message: "Plan creado exitosamente en Odoo",
      planId: `odoo_${templateId}`,
      odooId: templateId
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating plan in Odoo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
