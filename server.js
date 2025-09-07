const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.txt': 'image/svg+xml',  // CRITICAL: Treat .txt files as SVG since your SVG content is in .txt files
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // Parse URL and remove query parameters
  let filePath = req.url.split('?')[0];
  
  // Default to index.html for root requests
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Build the full file path
  const fullPath = path.join(__dirname, filePath);
  
  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>The requested file was not found.</p>');
      return;
    }
    
    // Read and serve the file
    fs.readFile(fullPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 Internal Server Error</h1><p>Error reading file.</p>');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    });
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});