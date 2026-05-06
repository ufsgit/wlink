require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { runMigrations } = require('./src/db/migrate');
const { handleWhatsappWebhook } = require('./src/webhooks/whatsapp');
const { handleFacebookWebhook } = require('./src/webhooks/facebook');
const { handleInstagramWebhook } = require('./src/webhooks/instagram');
const { handleRazorpayWebhook, handleStripeWebhook } = require('./src/webhooks/payments');
const { handleIncomingCall, handleKeyPress } = require('./src/controllers/ivr.controller');
const { redirect } = require('./src/controllers/ctwa.controller');
const { handleOptInLink } = require('./src/controllers/contacts.controller');
const { startBroadcastJob } = require('./src/jobs/broadcastJob');
const { startDripJob } = require('./src/jobs/dripJob');
const { startSmsJob } = require('./src/jobs/smsJob');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Store io on app for controller access
app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.get('/c/:shortCode', redirect);
app.get('/optin/:token', handleOptInLink);

// Webhook routes (no auth)
app.get('/api/webhooks/whatsapp', (req, res) => handleWhatsappWebhook(req, res, io));
app.post('/api/webhooks/whatsapp', (req, res) => handleWhatsappWebhook(req, res, io));
app.get('/api/webhooks/facebook', (req, res) => handleFacebookWebhook(req, res, io));
app.post('/api/webhooks/facebook', (req, res) => handleFacebookWebhook(req, res, io));
app.get('/api/webhooks/instagram', (req, res) => handleInstagramWebhook(req, res, io));
app.post('/api/webhooks/instagram', (req, res) => handleInstagramWebhook(req, res, io));
app.post('/api/webhooks/razorpay', handleRazorpayWebhook);
app.post('/api/webhooks/stripe', handleStripeWebhook);
app.post('/api/webhooks/ivr/incoming', handleIncomingCall);
app.post('/api/webhooks/ivr/keypress', handleKeyPress);

// API routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/contacts', require('./src/routes/contacts.routes'));
app.use('/api/conversations', require('./src/routes/conversations.routes'));
app.use('/api/templates', require('./src/routes/templates.routes'));
app.use('/api/broadcasts', require('./src/routes/broadcasts.routes'));
app.use('/api/chatbots', require('./src/routes/chatbots.routes'));
app.use('/api/drip', require('./src/routes/drip.routes'));
app.use('/api/ecommerce', require('./src/routes/ecommerce.routes'));
app.use('/api/ctwa', require('./src/routes/ctwa.routes'));
app.use('/api/widget', require('./src/routes/widget.routes'));
app.use('/api/rcs', require('./src/routes/rcs.routes'));
app.use('/api/sms', require('./src/routes/sms.routes'));
app.use('/api/ivr', require('./src/routes/ivr.routes'));
app.use('/api/integrations', require('./src/routes/integrations.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));
app.use('/api/affiliates', require('./src/routes/affiliates.routes'));
app.use('/api/settings', require('./src/routes/settings.routes'));

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socket.on('join_business', (businessId) => {
    socket.join(`biz_${businessId}`);
    console.log(`Socket ${socket.id} joined biz_${businessId}`);
  });
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'WLink API is running', data: { version: '1.0.0' } }));

// Start
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await runMigrations();
    startBroadcastJob();
    startDripJob();
    startSmsJob();
    server.listen(PORT, () => console.log(`🚀 WLink API running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
}

bootstrap();
