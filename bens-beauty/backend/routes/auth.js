const router = require('express').Router();
const { login, createCashier, getCashiers, changePassword, deleteCashier } = require('../controllers/auth.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

router.post('/login', login);
router.post('/cashiers', authenticate, adminOnly, createCashier);
router.get('/cashiers', authenticate, adminOnly, getCashiers);
router.put('/password', authenticate, adminOnly, changePassword);
router.delete('/cashiers/:id', authenticate, adminOnly, deleteCashier);

module.exports = router;
