var express = require('express');
var router = express.Router();
const groupController = require('../controllers/groupController')
const { uploadGroupPhoto } = require('../configuration/multerConfig')

router.get('/:groupId/profile', groupController.getGroup);

router.put('/:groupId/profile', uploadGroupPhoto.single('photo'), groupController.updateGroup);

router.delete('/:groupId/profile', groupController.deleteGroup);

router.post('/createDirectMessage', groupController.createDirectMessage);

router.post('/createGroup', uploadGroupPhoto.single('groupPhoto'), groupController.createGroup);

module.exports = router;