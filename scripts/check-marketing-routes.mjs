import { spawn } from 'child_process';
import http from 'http';

const PORT = 8089;
process.env.PORT = String(PORT);
process.env.NODE_ENV = 'production';

console.log('🚀 Starting test server instance on port ' + PORT + '...');

const serverProc = spawn('node', ['dist/server.cjs'], {
  env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe']
});

serverProc.stdout.on('data', data => {
  // console.log(`[Server]: ${data}`);
});
serverProc.stderr.on('data', data => {
  // console.error(`[Server ERR]: ${data}`);
});

function fetchRoute(pathStr) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port: PORT,
      path: pathStr,
      headers: { 'User-Agent': 'TestRunner/1.0' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout for ' + pathStr));
    });
  });
}

async function runTests() {
  console.log('⏳ Waiting for server to spin up...');
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetchRoute('/api/health');
      if (res.statusCode === 200) {
        ready = true;
        break;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (!ready) {
    console.error('❌ Server failed to start in time');
    serverProc.kill();
    process.exit(1);
  }

  console.log('✅ Server started! Running route assertions...\n');

  const tests = [
    { path: '/', expectedStatus: 200, expectedText: 'shapework. — Modern Workflow Design' },
    { path: '/about', expectedStatus: 200, expectedText: 'About' },
    { path: '/method', expectedStatus: 200, expectedText: 'Method' },
    { path: '/beliefs', expectedStatus: 200, expectedText: 'Beliefs' },
    { path: '/discovery', expectedStatus: 200, expectedText: 'Discovery' },
    { path: '/workflow-automation', expectedStatus: 200 },
    { path: '/ai-implementation', expectedStatus: 200 },
    { path: '/for-real-estate-brokerages', expectedStatus: 200 },
    { path: '/for-professional-services', expectedStatus: 200 },
    { path: '/for-healthcare-practices', expectedStatus: 200 },
    { path: '/operational-intelligence', expectedStatus: 200 },
    { path: '/operational-intelligence/what-we-keep-finding', expectedStatus: 200 },
    { path: '/operational-intelligence/what-is-ai-agent-orchestration', expectedStatus: 200 },
    { path: '/login', expectedStatus: 200, expectedText: '<div id="root">' },
    { path: '/api/health', expectedStatus: 200, expectedText: '"status":"healthy"' },
    { path: '/nest', expectedStatus: 404 },
    { path: '/nest/index.html', expectedStatus: 404 },
    { path: '/og-image.png', expectedStatus: 200 },
    { path: '/favicon.ico', expectedStatus: 200 }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const res = await fetchRoute(t.path);
      const statusOk = res.statusCode === t.expectedStatus;
      const textOk = t.expectedText ? res.body.includes(t.expectedText) : true;

      if (statusOk && textOk) {
        console.log(`  ✓ ${t.path} -> HTTP ${res.statusCode} ${t.expectedText ? `(Contains "${t.expectedText}")` : ''}`);
        passed++;
      } else {
        console.error(`  ✕ ${t.path} -> Expected HTTP ${t.expectedStatus}, got ${res.statusCode}. Text check: ${textOk}. Received snippet: ${res.body.slice(0, 100).replace(/\n/g, ' ')}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ✕ ${t.path} -> Exception: ${err.message}`);
      failed++;
    }
  }

  serverProc.kill();

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
