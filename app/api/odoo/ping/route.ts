import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const odoo = getOdooClient();
    // Authenticate and perform a lightweight query
    const uid = await odoo.authenticate();
    const partners = await odoo.executeKw('res.partner', 'search_read', [[['is_company', '=', true]]], {
      fields: ['id', 'name'],
      limit: 1,
    });

    return NextResponse.json({ ok: true, uid, partners });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
