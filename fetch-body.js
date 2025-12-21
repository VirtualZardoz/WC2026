const http = require('http');
const url = process.argv[2] || 'http://localhost:3000';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
