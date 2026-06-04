const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 10000;
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 3001;

console.log('Starting LinkedIn Bot Unified Gateway...');

// Start Frontend (Next.js Standalone)
const frontendPath = path.join(__dirname, 'frontend', 'server.js');
console.log(`Starting frontend from ${frontendPath} on port ${FRONTEND_PORT}...`);

const frontend = spawn('node', [frontendPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: FRONTEND_PORT,
    NODE_ENV: 'production'
  }
});

// Start Backend
const backendPath = path.join(__dirname, 'backend', 'dist', 'server.js');
console.log(`Starting backend from ${backendPath} on port ${BACKEND_PORT}...`);

const backend = spawn('node', [backendPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: BACKEND_PORT,
    NODE_ENV: 'production'
  }
});

// Create Gateway Proxy Server
const server = http.createServer((req, res) => {
  const targetPort = req.url.startsWith('/api') ? BACKEND_PORT : FRONTEND_PORT;
  
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error routing ${req.url} to port ${targetPort}:`, err.message);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Gateway proxy server listening on port ${PORT}`);
});

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down child processes...`);
  frontend.kill();
  backend.kill();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
