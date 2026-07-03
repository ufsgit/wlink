const express = require('express');
const app = express();
const router = express.Router();

router.get('/:id', (req, res) => res.send('getContact'));
router.get('/:id/history', (req, res) => res.send('getContactHistory'));

app.use('/contacts', router);

const request = require('supertest');

request(app)
  .get('/contacts/104/history')
  .end((err, res) => {
    console.log('Response:', res.text);
    process.exit(0);
  });
