const express = require('express');
const messageController = require('../controllers/messagesController');
const { uploadMessagePhoto } = require('../configuration/multerConfig');

module.exports = function(io) {
    const router = express.Router();

    // Wrap each controller function to include io
    const wrapController = (controller) => (req, res, next) => {
        controller(req, res, next, io);
    };

    router.get('/:userId', wrapController(messageController.getGroupsWithMessagesAndUsers));
    router.post('/:chatId', uploadMessagePhoto.single('photoUrl'), wrapController(messageController.createMessage));
    router.put('/:chatId/:messageId', wrapController(messageController.updateMessage));
    router.delete('/:chatId/:messageId', wrapController(messageController.deleteMessage));

    return router;
};