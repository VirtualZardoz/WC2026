const http = require('http');

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode);
    });

    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
      resolve(500);
    });

    req.end();
  });
}

async function run() {
  console.log('Testing API authentication...');
  
  const endpoints = [
    { path: '/api/predictions', status: 401 },
    { path: '/api/admin/matches/result', status: 401, method: 'POST' },
    { path: '/api/admin/settings/deadline', status: 401, method: 'POST' },
    { path: '/api/profile/password', status: 401, method: 'PUT' },
  ];

  for (const endpoint of endpoints) {
    const status = await testEndpoint(endpoint.path, endpoint.method);
    console.log(`${endpoint.method || 'GET'} ${endpoint.path} => ${status}`);
    if (status !== endpoint.status) {
      console.error(`FAILED: Expected ${endpoint.status}, got ${status}`);
      process.exit(1);
    }
  }

  console.log('API Authentication verified (401 when no session)');
}

run();
