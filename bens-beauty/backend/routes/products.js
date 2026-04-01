const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/products.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

router.get('/', authenticate, getAll);
router.post('/', authenticate, adminOnly, create);
router.put('/:id', authenticate, adminOnly, update);
router.delete('/:id', authenticate, adminOnly, remove);

module.exports = router;
