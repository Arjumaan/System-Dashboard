const router = require('express').Router();
const { getSystemStats, getProcesses } = require('../controllers/systemController');

router.get('/stats', getSystemStats);
router.get('/processes', getProcesses);

module.exports = router;
