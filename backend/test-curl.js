const http = require('http');

http.get('http://localhost:3000/api/contacts/104/history', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data);
    process.exit(0);
  });
}).on('error', err => {
  console.error(err);
  process.exit(1);
});
