const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'dist');
const types = {
  js: 'text/javascript',
  css: 'text/css',
  html: 'text/html',
  png: 'image/png',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  json: 'application/json',
  webp: 'image/webp',
};

http.createServer((req, res) => {
  let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).slice(1);
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(3001, () => console.log('Web server on http://localhost:3001'));
