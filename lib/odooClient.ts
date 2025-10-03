// Lightweight Odoo XML-RPC client for server-side usage
// Reads Odoo credentials from environment and exposes authenticate/executeKw

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - xmlrpc has no types
import xmlrpc from 'xmlrpc';

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function parseBaseUrl(baseUrl: string) {
  const u = new URL(baseUrl);
  const host = u.hostname;
  const port = Number(u.port || (u.protocol === 'https:' ? 443 : 80));
  const secure = u.protocol === 'https:';
  return { host, port, secure };
}

function methodCall<T = any>(client: any, method: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: any, value: T) => (err ? reject(err) : resolve(value)));
  });
}

export class OdooClient {
  private db: string;
  private username: string;
  private password: string;
  private uid: number | null = null;
  private common: any;
  private models: any;

  constructor({ baseUrl, db, username, password }: { baseUrl: string; db: string; username: string; password: string }) {
    const { host, port, secure } = parseBaseUrl(baseUrl);
    const createClient = secure ? xmlrpc.createSecureClient : xmlrpc.createClient;

    this.db = db;
    this.username = username;
    this.password = password;

    this.common = createClient({ host, port, path: '/xmlrpc/2/common' });
    this.models = createClient({ host, port, path: '/xmlrpc/2/object' });
  }

  async authenticate(): Promise<number> {
    if (this.uid) return this.uid;
    const uid = await methodCall<number>(this.common, 'authenticate', [this.db, this.username, this.password, {}]);
    if (!uid) throw new Error('Authentication failed: UID is empty. Check DB/username/password.');
    this.uid = uid;
    return uid;
  }

  async executeKw<T = any>(model: string, method: string, params: any[] = [], kwargs: Record<string, any> = {}): Promise<T> {
    const uid = await this.authenticate();
    return methodCall<T>(this.models, 'execute_kw', [this.db, uid, this.password, model, method, params, kwargs]);
  }

  // Academy-specific methods for billing integration
  async createPartner(partnerData: {
    name: string;
    email: string;
    phone?: string;
    x_external_id?: string;
  }): Promise<number> {
    const existingPartner = await this.executeKw<number[]>('res.partner', 'search', [
      [['email', '=', partnerData.email]]
    ]);
    
    if (existingPartner.length > 0) {
      return existingPartner[0];
    }

    return this.executeKw<number>('res.partner', 'create', [partnerData]);
  }

  async createSubscriptionProduct(productData: {
    name: string;
    list_price: number;
    recurring_rule_type: 'monthly' | 'yearly';
    x_external_id?: string;
  }): Promise<number> {
    const existingProduct = productData.x_external_id ? 
      await this.executeKw<number[]>('product.template', 'search', [
        [['x_external_id', '=', productData.x_external_id]]
      ]) : [];
    
    if (existingProduct.length > 0) {
      return existingProduct[0];
    }

    return this.executeKw<number>('product.template', 'create', [{
      ...productData,
      type: 'service',
      recurring_invoice: true,
    }]);
  }

  async createSubscription(subscriptionData: {
    partner_id: number;
    template_id: number;
    x_external_id?: string;
  }): Promise<number> {
    return this.executeKw<number>('sale.subscription', 'create', [subscriptionData]);
  }

  async createPaymentLink(invoiceId: number): Promise<string> {
    // Get payment acquirers
    const acquirers = await this.listActiveAcquirers();
    if (acquirers.length === 0) {
      throw new Error('No active payment acquirers found');
    }

    // Create payment link for invoice
    const paymentLink = await this.executeKw<any>('payment.link.wizard', 'create', [{
      res_model: 'account.move',
      res_id: invoiceId,
      amount: 0, // Will use invoice amount
      currency_id: 1, // CLP - adjust based on your setup
      partner_id: await this.getInvoicePartnerId(invoiceId),
    }]);

    const linkData = await this.executeKw<any>('payment.link.wizard', 'read', [
      [paymentLink], ['link']
    ]);

    return linkData[0]?.link || '';
  }

  async listActiveAcquirers(): Promise<any[]> {
    return this.executeKw<any[]>('payment.acquirer', 'search_read', [
      [['state', '=', 'enabled']], 
      ['name', 'provider', 'state']
    ]);
  }

  async getTransactionStatus(transactionId: number): Promise<any> {
    return this.executeKw<any>('payment.transaction', 'read', [
      [transactionId], 
      ['state', 'reference', 'amount', 'currency_id', 'partner_id']
    ]);
  }

  async createInvoice(invoiceData: {
    partner_id: number;
    invoice_line_ids: Array<{
      product_id: number;
      quantity: number;
      price_unit: number;
      name: string;
    }>;
    x_external_id?: string;
  }): Promise<number> {
    const lineCommands = invoiceData.invoice_line_ids.map(line => [0, 0, line]);
    
    return this.executeKw<number>('account.move', 'create', [{
      partner_id: invoiceData.partner_id,
      move_type: 'out_invoice',
      invoice_line_ids: lineCommands,
      x_external_id: invoiceData.x_external_id,
    }]);
  }

  private async getInvoicePartnerId(invoiceId: number): Promise<number> {
    const invoice = await this.executeKw<any>('account.move', 'read', [
      [invoiceId], ['partner_id']
    ]);
    return invoice[0]?.partner_id[0] || 0;
  }
}

let singleton: OdooClient | null = null;
export function getOdooClient(): OdooClient {
  if (!singleton) {
    const baseUrl = requiredEnv('ODOO_BASE_URL');
    const db = requiredEnv('ODOO_DB');
    const username = requiredEnv('ODOO_USERNAME');
    const password = requiredEnv('ODOO_PASSWORD');
    singleton = new OdooClient({ baseUrl, db, username, password });
  }
  return singleton;
}
