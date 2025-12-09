const router = require('express').Router();
const { readEvents } = require('../controllers/eventsController');

router.get('/', readEvents);

module.exports = router;
