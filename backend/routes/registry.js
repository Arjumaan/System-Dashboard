const router = require('express').Router();
const { readRegistry } = require('../controllers/registryController');

router.get('/', readRegistry);

module.exports = router;
