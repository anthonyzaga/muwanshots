#!/usr/bin/env node
// Create initial admin — usage: npm run create-admin -- --email admin@muwanshots.com --password StrongPass123 --name "Muwan Admin"
// Or set ADMIN_EMAIL / ADMIN_PASSWORD env vars
// Works with local D1 (wrangler) and remote (requires --remote flag)

import * as bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import crypto from 'crypto';

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return process.env[name.toUpperCase()] || fallback;
}

const email = getArg('email', process.env.ADMIN_EMAIL);
const password = getArg('password', process.env.ADMIN_PASSWORD);
const name = getArg('name', process.env.ADMIN_NAME || 'Admin');
const remote = args.includes('--remote');

if (!email || !password) {
  console.error(`
Usage:
  npm run create-admin -- --email admin@muwanshots.com --password StrongPass123 --name "Muwan Admin" [--remote]

Or via env:
  ADMIN_EMAIL=admin@muwanshots.com ADMIN_PASSWORD=StrongPass123 npm run create-admin

Use --remote to target production D1 (requires wrangler login). Default is --local.

Requirements:
  - JWT_SECRET must be set in .dev.vars (local) or via wrangler secret (remote)
  - D1 database must exist and migrations applied: npx wrangler d1 migrations apply muwanshots-db ${remote ? '--remote' : '--local'}

Security:
  - Password is hashed with bcrypt (10 rounds) before storage
  - Never store plaintext
  - Script does not log password
`);
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const id = crypto.randomUUID();
const now = new Date().toISOString();

const sql = `INSERT INTO admins (id, email, password_hash, name, is_active, created_at, updated_at) VALUES ('${id}', '${email.toLowerCase()}', '${hash.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', 1, '${now}', '${now}');`;

console.log(`Creating admin ${email} (${name}) with id ${id}...`);
console.log(`Target: ${remote ? 'remote' : 'local'} D1 muwanshots-db`);

try {
  const cmd = `npx wrangler d1 execute muwanshots-db --command "${sql.replace(/"/g, '\\"')}" ${remote ? '--remote' : '--local'}`;
  const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
  console.log(output);
  console.log(`\n✅ Admin created: ${email}`);
  console.log(`   Login at: /admin/login`);
  console.log(`   Password: (hidden, ${password.length} chars — store securely)`);
} catch (e) {
  console.error('Failed to create admin:', e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.error(e.stderr.toString());
  process.exit(1);
}
