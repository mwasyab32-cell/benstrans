const router = require('express').Router();
const { checkout, getHistory, getSaleDetail, getDailySummary } = require('../controllers/sales.controller');
const { authenticate } = require('../middleware/auth');

router.post('/checkout', authenticate, checkout);
router.get('/', authenticate, getHistory);
router.get('/summary', authenticate, getDailySummary);
router.get('/:id', authenticate, getSaleDetail);

module.exports = router;
