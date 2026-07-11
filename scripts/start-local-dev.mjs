/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'child_process';
import net from 'net';

const PORT = process.env.PORT || 3000;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port occupied
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port free
    });
    server.listen(port);
  });
}

async function start() {
  const isOccupied = await checkPort(PORT);
  if (isOccupied) {
    console.error(`\n🔴 Error: Port ${PORT} is already in use by another process.`);
    console.error(`👉 Run 'lsof -i :${PORT}' to locate the PID and kill it ('kill -9 <PID>') before starting.`);
    console.error(`👉 Alternatively, you can specify a different port: 'PORT=3001 npm run dev'\n`);
    process.exit(1);
  }

  console.log(`\n🟢 Port ${PORT} is free. Spawning full-stack server...\n`);
  const child = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DEMO_PASSCODE: process.env.DEMO_PASSCODE || 'shapework2026'
    }
  });

  child.on('close', (code) => {
    process.exit(code);
  });
}

start();
