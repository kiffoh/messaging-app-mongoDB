const express = require('express');
const messageController = require('../controllers/messagesController');

module.exports = function(io) {
    const router = express.Router();

    // Wrap each controller function to include io
    const wrapController = (controller) => (req, res, next) => {
        controller(req, res, next, io);
    };

    router.get('/:userId', wrapController(messageController.getMessages));
    router.post('/:chatId', wrapController(messageController.createMessage));
    router.put('/:chatId/:messageId', wrapController(messageController.updateMessage));
    router.delete('/:chatId/:messageId', wrapController(messageController.deleteMessage));

    return router;
};