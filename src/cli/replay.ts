import { readFileSync } from 'node:fs';

try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const target = process.argv[2];
if (!target) {
  console.error('Usage: npm run replay -- <fixture-name | path.json>');
  process.exit(1);
}

const path = target.endsWith('.json') ? target : `fixtures/gsi/${target}.json`;
const body = JSON.parse(readFileSync(path, 'utf8')) as {
  auth?: { token?: string };
};
const token = process.env['GSI_AUTH_TOKEN'];
if (!token) {
  console.error('GSI_AUTH_TOKEN is not set (check your .env).');
  process.exit(1);
}
body.auth = { token };

const port = process.env['GSI_PORT'] ?? '3000';
const res = await fetch(`http://127.0.0.1:${port}/`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});
console.log(`${res.status} ${await res.text()}`.trim());
