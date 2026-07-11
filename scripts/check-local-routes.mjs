/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
console.log(`\n=== Starting shapework. Local Route Checks ===`);
console.log(`Targeting base URL: ${BASE_URL}\n`);

const routes = [
  { path: '/', type: 'GET', name: 'Public Landing Page' },
  { path: '/demo', type: 'GET', name: 'Demo Workspace Dashboard' },
  { path: '/api/health', type: 'GET', name: 'System Health Check' },
  { path: '/api/debug/routes', type: 'GET', name: 'Debug Route Registry' },
  { path: '/api/debug/integrations', type: 'GET', name: 'Debug Integration Registries' },
  { path: '/api/demo/events', type: 'POST', name: 'Demo Event Ingestion Webhook' }
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${route.path}`;
    const options = {
      method: route.type,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // GET returns 200 or 302, POST demo/events without payload might return 400 (which is expected because of missing parameters, but verifies route exists!)
        const isSuccess = res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 302 || res.statusCode === 401;
        console.log(`[${isSuccess ? 'PASS' : 'FAIL'}] ${route.type} ${route.path} - ${route.name} (Status: ${res.statusCode})`);
        resolve(isSuccess);
      });
    });

    req.on('error', (err) => {
      console.log(`[FAIL] ${route.type} ${route.path} - ${route.name} (Error: Connection Refused. Is the server running?)`);
      resolve(false);
    });

    if (route.type === 'POST') {
      req.write(JSON.stringify({}));
    }
    req.end();
  });
}

async function run() {
  let passedAll = true;
  for (const route of routes) {
    const pass = await checkRoute(route);
    if (!pass) passedAll = false;
  }

  console.log(`\n=== Results Summary ===`);
  if (passedAll) {
    console.log(`🟢 All core local routing endpoints are fully active and reachable!`);
    console.log(`👉 BROWSER URL TO TEST: ${BASE_URL}/demo`);
  } else {
    console.log(`🔴 Some local routes failed. Please ensure you started the master full-stack server using "npm run dev" and that port 3000 is not blocked.`);
  }
}

run();
