const http = require('http');

const PORT = 3000;
const HOST = '0.0.0.0';

// ❌ Crash immediately (before server starts)
console.log("App failed to start!");
process.exit(1);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('This should never run\n');
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});