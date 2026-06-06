const http = require('http');

console.log('🔍 Querying CuriousBees system health check...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const health = JSON.parse(data);
        console.log('\n=============================================');
        console.log(` CuriousBees Health Check: ${health.status.toUpperCase()}`);
        console.log('=============================================');
        console.log(`📡 API Status:       ${health.api ? '✅ ONLINE' : '❌ OFFLINE'}`);
        console.log(`🗄️ Database Status:  ${health.database ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
        console.log(`💡 Redis Status:     ${health.redis ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
        console.log(`🌐 Environment:      ${health.environment}`);
        console.log(`🏷️ API Version:      ${health.version}`);
        console.log(`⏱️ System Uptime:    ${Math.round(health.uptime)}s`);
        console.log(`📅 Timestamp:        ${health.timestamp}`);
        console.log('=============================================\n');
        process.exit(health.status === 'healthy' ? 0 : 1);
      } catch (err) {
        console.error('❌ Failed to parse health check response:', err.message);
        process.exit(1);
      }
    } else {
      console.error(`❌ Health check failed with HTTP status: ${res.statusCode}`);
      console.error('Body:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ Could not connect to API server. Make sure it is running on port 4000.');
  console.error(`Error details: ${err.message}\n`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('\n❌ Health check request timed out after 5 seconds.\n');
  req.destroy();
  process.exit(1);
});

req.end();
