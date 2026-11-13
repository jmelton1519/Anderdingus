try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run ask -- <bomb|economy|round>');
  process.exit(1);
}

const port = process.env['GSI_PORT'] ?? '3000';
const res = await fetch(
  `http://127.0.0.1:${port}/query/${encodeURIComponent(name)}`,
);
console.log(await res.text());
