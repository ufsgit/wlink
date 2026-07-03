const express = require('express');
const app = express();
const router = express.Router();

router.get('/:id', (req, res) => res.json({ msg: 'getContact', id: req.params.id }));
router.get('/:id/history', (req, res) => res.json({ msg: 'getContactHistory', id: req.params.id }));

app.use('/api/contacts', router);

const server = app.listen(3001, () => {
  const http = require('http');
  http.get('http://localhost:3001/api/contacts/104/history', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      server.close();
      process.exit(0);
    });
  });
});
