var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');

/* GET users listing. */
router.post('/signup', userController.createUser);

router.post('/login', userController.logIn);

router.get('/:userId/profile', userController.getUser);

module.exports = router;
