/**
 * Script para confirmar pagos de Flow pendientes
 * Uso: npx tsx scripts/confirm-flow-payments.ts
 * 
 * Este script consulta la API de Flow para verificar el estado real
 * de los pagos y actualiza la base de datos local.
 * 
 * Es necesario porque Flow no puede enviar webhooks a localhost.
 */

import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Debug: show if credentials are loaded
console.log("🔑 Credenciales Flow:", process.env.FLOW_API_KEY ? "Cargadas ✅" : "No encontradas ❌")

// Flow API configuration
const FLOW_API_URL = process.env.FLOW_ENVIRONMENT === "production"
  ? "https://www.flow.cl/api"
  : "https://sandbox.flow.cl/api"

function generateSignature(params: Record<string, string>, secretKey: string): string {
  const crypto = require("crypto")
  const sortedKeys = Object.keys(params).sort()
  const signatureString = sortedKeys.map(key => `${key}${params[key]}`).join("")
  return crypto.createHmac("sha256", secretKey).update(signatureString).digest("hex")
}

async function getFlowPaymentStatus(token: string, apiKey?: string | null, secretKey?: string | null) {
  const finalApiKey = apiKey || process.env.FLOW_API_KEY
  const finalSecretKey = secretKey || process.env.FLOW_SECRET_KEY

  if (!finalApiKey || !finalSecretKey) {
    throw new Error("Credenciales de Flow no disponibles")
  }

  const requestParams: Record<string, string> = { apiKey: finalApiKey, token }
  const signature = generateSignature(requestParams, finalSecretKey)
  requestParams.s = signature

  const queryString = new URLSearchParams(requestParams).toString()
  const response = await fetch(`${FLOW_API_URL}/payment/getStatus?${queryString}`)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Flow API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function main() {
  console.log("🔍 Buscando pagos de Flow pendientes...")
  console.log(`📡 Usando API: ${FLOW_API_URL}`)
  
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      method: "FLOW",
      odooTransactionId: { not: null },
    },
    include: {
      academy: { select: { id: true, name: true, flowApiKey: true, flowSecretKey: true } },
      membership: {
        include: {
          user: { select: { name: true, email: true } },
          plan: { select: { name: true } },
        },
      },
    },
  })

  console.log(`\n📋 Encontrados ${pendingPayments.length} pagos pendientes de Flow\n`)

  if (pendingPayments.length === 0) {
    console.log("✅ No hay pagos pendientes para procesar")
    return
  }

  let updated = 0
  let activated = 0

  for (const payment of pendingPayments) {
    const userName = payment.membership?.user?.name || "Usuario"
    const planName = payment.membership?.plan?.name || "Plan"
    
    console.log(`\n💳 Procesando pago ${payment.id}`)
    console.log(`   Usuario: ${userName}`)
    console.log(`   Plan: ${planName}`)
    console.log(`   Monto: $${payment.amount.toLocaleString("es-CL")}`)

    try {
      if (!payment.odooTransactionId) {
        console.log(`   ⚠️ Sin token de Flow, saltando...`)
        continue
      }

      // Use academy credentials if available, otherwise fallback to env vars
      const academyApiKey = (payment as any).academy?.flowApiKey
      const academySecretKey = (payment as any).academy?.flowSecretKey
      const flowStatus = await getFlowPaymentStatus(payment.odooTransactionId, academyApiKey, academySecretKey)
      console.log(`   Estado en Flow: ${flowStatus.status} (${getStatusText(flowStatus.status)})`)

      // Map Flow status: 1=Pending, 2=Paid, 3=Rejected, 4=Cancelled
      let newStatus: "PENDING" | "PAID" | "FAILED" | "CANCELED" = "PENDING"
      if (flowStatus.status === 2) newStatus = "PAID"
      else if (flowStatus.status === 3) newStatus = "FAILED"
      else if (flowStatus.status === 4) newStatus = "CANCELED"

      if (newStatus !== payment.status) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            externalRef: `flow-${flowStatus.flowOrder}`,
            paidAt: newStatus === "PAID" ? new Date() : null,
            failureReason: newStatus === "FAILED" ? `Flow: ${getStatusText(flowStatus.status)}` : null,
          },
        })
        console.log(`   ✅ Estado actualizado: ${payment.status} → ${newStatus}`)
        updated++

        // Activate membership if paid
        if (newStatus === "PAID" && payment.membershipId) {
          await prisma.membership.update({
            where: { id: payment.membershipId },
            data: { status: "ACTIVE" },
          })
          console.log(`   🎉 Membresía activada!`)
          activated++

          // Expire other memberships
          if (payment.membership?.userId) {
            await prisma.membership.updateMany({
              where: {
                userId: payment.membership.userId,
                id: { not: payment.membershipId },
                status: { in: ["ACTIVE", "TRIAL"] },
              },
              data: { status: "EXPIRED" },
            })
          }
        }
      } else {
        console.log(`   ℹ️ Estado sin cambios (${payment.status})`)
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log(`\n${"=".repeat(50)}`)
  console.log(`📊 Resumen:`)
  console.log(`   - Pagos procesados: ${pendingPayments.length}`)
  console.log(`   - Pagos actualizados: ${updated}`)
  console.log(`   - Membresías activadas: ${activated}`)
  console.log(`${"=".repeat(50)}\n`)
}

function getStatusText(status: number): string {
  switch (status) {
    case 1: return "Pendiente"
    case 2: return "Pagado"
    case 3: return "Rechazado"
    case 4: return "Anulado"
    default: return "Desconocido"
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
