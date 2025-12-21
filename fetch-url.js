const http = require('http');
const url = process.argv[2] || 'http://localhost:3000';

http.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Location:', res.headers.location);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response length:', data.length);
    if (data.length > 0) {
        console.log('Preview:', data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
