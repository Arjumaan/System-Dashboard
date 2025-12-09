const router = require('express').Router();
const { generateReport } = require('../controllers/reportController');

router.get('/', generateReport);

module.exports = router;
