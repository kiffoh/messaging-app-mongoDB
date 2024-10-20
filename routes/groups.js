var express = require('express');
var router = express.Router();
const groupController = require('../controllers/groupController')
const { uploadGroupPhoto } = require('../configuration/multerConfig');
const { validateGroup } = require('../configuration/validation'); // Import the validation middleware
const { validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

router.get('/:groupId/profile', groupController.getGroup);

router.put('/:groupId/profile', 
    uploadGroupPhoto.single('photo'), 
    validateGroup, // Add validation middleware
    validateRequest,
    groupController.updateGroup
);

router.delete('/:groupId/profile', groupController.deleteGroup);

router.post('/createDirectMessage', groupController.createDirectMessage);

router.post('/createGroup', 
    uploadGroupPhoto.single('groupPhoto'), 
    validateGroup,
    validateRequest,
    groupController.createGroup
);

module.exports = router;