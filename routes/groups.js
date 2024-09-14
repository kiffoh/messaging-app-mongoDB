var express = require('express');
var router = express.Router();
const groupController = require('../controllers/groupController')

router.get('/:groupId/profile', groupController.getGroup);

module.exports = router;