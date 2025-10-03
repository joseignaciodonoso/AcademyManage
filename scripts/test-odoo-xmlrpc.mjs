#!/usr/bin/env node
import 'dotenv/config';
import xmlrpc from 'xmlrpc';

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (!v && fallback === undefined) throw new Error(`Missing env ${name}`);
  return v ?? fallback;
}

const ODOO_BASE_URL = getEnv('ODOO_BASE_URL');
const ODOO_DB = getEnv('ODOO_DB');
const ODOO_USERNAME = getEnv('ODOO_USERNAME');
const ODOO_PASSWORD = getEnv('ODOO_PASSWORD');

const u = new URL(ODOO_BASE_URL);
const host = u.hostname;
const port = Number(u.port || (u.protocol === 'https:' ? 443 : 80));

const common = xmlrpc.createClient({ host, port, path: '/xmlrpc/2/common' });
const models = xmlrpc.createClient({ host, port, path: '/xmlrpc/2/object' });

function call(client, method, params = []) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => (err ? reject(err) : resolve(value)));
  });
}

async function main() {
  try {
    const version = await call(common, 'version');
    console.log('Odoo version:', version);

    const uid = await call(common, 'authenticate', [ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {}]);
    if (!uid) throw new Error('Login failed: UID empty. Check DB, username, or password.');
    console.log('Authenticated. UID:', uid);

    const partners = await call(models, 'execute_kw', [
      ODOO_DB,
      uid,
      ODOO_PASSWORD,
      'res.partner',
      'search_read',
      [[['is_company', '=', true]]],
      { fields: ['id', 'name'], limit: 3 },
    ]);
    console.log('Sample partners:', partners);
  } catch (err) {
    console.error('XML-RPC test failed:', err?.message || err);
    process.exit(1);
  }
}

main();
