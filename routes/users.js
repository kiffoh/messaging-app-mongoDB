var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const {uploadUserPhoto} = require('../configuration/multerConfig')
const { validateUserSignUp, validateUser } = require('../configuration/validation');
const { validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors)
      return res.status(400).json({
        status: 'error',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  };

/* GET users listing. */
router.post('/signup', 
    validateUserSignUp,
    validateRequest,
    userController.createUser
);

router.post('/login', userController.logIn);

router.get('/:userId/profile', userController.getUser);

router.put('/:userId/profile', 
    uploadUserPhoto.single('photo'), 
    validateUser, // Validation middleware
    validateRequest,
    userController.updateUser
);
  

router.delete('/:userId/profile', userController.deleteUser);

router.get('/usernames', userController.getAllUsernames);

router.put('/:userId/update-contacts', userController.updateUserContacts)



module.exports = router;
