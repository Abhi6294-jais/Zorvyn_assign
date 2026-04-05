const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');
const { isAuthenticated, isAdminOrAnalyst } = require('../middleware/roleCheck');
const { validate, transactionValidation } = require('../middleware/validation');

router.use(authMiddleware);
router.use(isAuthenticated);

// ✅ Specific named routes FIRST (before /:id)
router.get('/stats/summary',
  isAdminOrAnalyst,
  transactionController.getTransactionStats
);

router.post('/bulk-delete',
  isAdminOrAnalyst,
  transactionController.bulkDeleteTransactions
);

// General listing and detail
router.get('/', validate(transactionValidation.filters), transactionController.getTransactions);
router.get('/:id', validate(transactionValidation.id), transactionController.getTransactionById);

// Analyst and Admin can create, update, delete
router.post('/',
  isAdminOrAnalyst,
  validate(transactionValidation.create),
  transactionController.createTransaction
);

router.put('/:id',
  isAdminOrAnalyst,
  validate(transactionValidation.update),
  transactionController.updateTransaction
);

router.delete('/:id',
  isAdminOrAnalyst,
  validate(transactionValidation.id),
  transactionController.deleteTransaction
);

module.exports = router;