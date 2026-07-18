import { spawn, execSync, type ChildProcess } from "child_process";

const PORT = 3100;
export const BASE_URL = `http://localhost:${PORT}`;

let server: ChildProcess | undefined;

async function waitForServer(url: string, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

export async function setup() {
  // Fresh, seeded database
  execSync("npx prisma db push --force-reset --skip-generate", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    env: { ...process.env },
    detached: true,
  });
  await waitForServer(`${BASE_URL}/api/businesses`);
}

export async function teardown() {
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
}
