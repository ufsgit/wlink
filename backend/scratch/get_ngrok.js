const http = require('http');

http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const httpsTunnel = parsed.tunnels.find(t => t.public_url.startsWith('https://'));
      console.log('Ngrok URL:', httpsTunnel ? httpsTunnel.public_url : 'Not found');
    } catch (e) {
      console.error('Error parsing ngrok response:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching ngrok api:', err.message);
});
