var express = require('express');
var router = express.Router();
const groupController = require('../controllers/groupController')
const { uploadGroupPhoto } = require('../configuration/multerConfig');
const { validateGroup } = require('../configuration/validation'); // Import the validation middleware
const { validationResult } = require('express-validator');

router.get('/:groupId/profile', groupController.getGroup);

router.put('/:groupId/profile', 
    uploadGroupPhoto.single('photo'), 
    validateGroup, // Add validation middleware
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    },
    groupController.updateGroup
);

router.delete('/:groupId/profile', groupController.deleteGroup);

router.post('/createDirectMessage', groupController.createDirectMessage);

router.post('/createGroup', 
    uploadGroupPhoto.single('groupPhoto'), 
    validateGroup,
    (req, res, next) => {
        const errors = validationResult(req);
        console.log(errors)
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()})
        }
        next();
    },
    groupController.createGroup
);

module.exports = router;