const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// Allowed categories
const allowedCategories = [
  'salary', 'business', 'investment', 'rent', 'utilities',
  'groceries', 'transportation', 'entertainment', 'healthcare',
  'education', 'shopping', 'other'
];

// User validation rules
const userValidation = {
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role')
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim(),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
  ]
};

// Transaction validation rules
const transactionValidation = {
  create: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category')
      .isIn(allowedCategories)
      .withMessage(`Category must be one of: ${allowedCategories.join(', ')}`),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid transaction ID'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category')
      .optional()
      .isIn(allowedCategories)
      .withMessage(`Category must be one of: ${allowedCategories.join(', ')}`),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
  ],
  id: [
    param('id').isMongoId().withMessage('Invalid transaction ID')
  ],
  filters: [
    query('type').optional().isIn(['income', 'expense']).withMessage('Invalid type'),
    query('category').optional().isIn(allowedCategories).withMessage('Invalid category'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  validate,
  userValidation,
  transactionValidation,
  allowedCategories
};