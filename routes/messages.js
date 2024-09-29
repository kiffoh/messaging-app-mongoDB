var express = require('express');
var router = express.Router();
const messagesController = require('../controllers/messagesController');

router.get('/:userId', messagesController.getMessages);

router.post('/:chatId', messagesController.createMessage)

router.put('/:chatId/:messageId', messagesController.updateMessage)

router.delete('/:chatId/:messageId', messagesController.deleteMessage);

module.exports = router;