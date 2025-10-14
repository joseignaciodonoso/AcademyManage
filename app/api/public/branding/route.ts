import { NextResponse } from "next/server"

export async function GET() {
  try {
    const data = {
      academyName: process.env.NEXT_PUBLIC_ACADEMY_NAME || "Mi Academia",
      bank: process.env.NEXT_PUBLIC_BANK_NAME || "Banco Estado",
      accountType: process.env.NEXT_PUBLIC_BANK_ACCOUNT_TYPE || "Cuenta Vista",
      accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "12345678",
      holder: process.env.NEXT_PUBLIC_BANK_ACCOUNT_HOLDER || "Academy Pro SpA",
      rut: process.env.NEXT_PUBLIC_BANK_ACCOUNT_RUT || "76.123.456-7",
      email: process.env.NEXT_PUBLIC_BANK_PAYMENT_EMAIL || "pagos@academy.pro",
    }
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error" }, { status: 500 })
  }
}
