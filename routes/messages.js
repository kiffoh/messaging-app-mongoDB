var express = require('express');
var router = express.Router();
const messagesController = require('../controllers/messagesController');

router.get('/:userId', messagesController.getMessages);


module.exports = router;