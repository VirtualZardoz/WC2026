const http = require('http');

http.get('http://localhost:3000', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response length:', data.length);
    console.log('Preview:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
