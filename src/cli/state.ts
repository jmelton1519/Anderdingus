try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const port = process.env['GSI_PORT'] ?? '3000';
const res = await fetch(`http://127.0.0.1:${port}/state`);
console.log(await res.text());
