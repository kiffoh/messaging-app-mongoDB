const { body } = require('express-validator'); // Make sure express-validator is imported

const validateUserSignUp = [
  body("username").trim()
    .isLength({ max: 10 }).withMessage('Username must be a maximum of 10 characters.')
];

const validateUser = [
  body("username").trim().optional()
    .isLength({ max: 10 }).withMessage('Username must be a maximum of 10 characters.'),
  body("bio").trim().optional()
    .isLength({ max: 200 }).withMessage('Bio must be a maximum of 200 characters.')
];

const validateGroup = [
  body("name").trim().optional()
    .isLength({ max: 20 }).withMessage('Group name must be a maximum of 20 characters.'),
  body("bio").trim().optional()
    .isLength({ max: 200 }).withMessage('Bio must be a maximum of 200 characters.')
];

module.exports = {
  validateUserSignUp,
  validateUser,
  validateGroup
};
