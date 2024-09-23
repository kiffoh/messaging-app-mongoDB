var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const {uploadUserPhoto} = require('../configuration/multerConfig')

/* GET users listing. */
router.post('/signup', userController.createUser);

router.post('/login', userController.logIn);

router.get('/:userId/profile', userController.getUser);

router.put('/:userId/profile', uploadUserPhoto.single('photo'), userController.updateUser);

router.delete('/:userId/profile', userController.deleteUser);

router.get('/usernames', userController.getAllUsernames);

router.put('/:userId/update-contacts', userController.updateUserContacts)



module.exports = router;
