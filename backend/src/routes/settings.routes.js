const router = require('express').Router();
const c = require('../controllers/settings.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);
router.get('/business', c.getBusiness);
router.put('/business', requireRole('admin', 'superadmin'), c.updateBusiness);
router.get('/team', c.getTeam);
router.post('/team', requireRole('admin', 'superadmin'), c.inviteAgent);
router.put('/team/:id', requireRole('admin', 'superadmin'), c.updateAgent);
router.delete('/team/:id', requireRole('admin', 'superadmin'), c.deleteAgent);
router.get('/billing', c.getBilling);
router.post('/whatsapp/test', requireRole('admin', 'superadmin'), c.testWhatsAppConnection);

module.exports = router;
