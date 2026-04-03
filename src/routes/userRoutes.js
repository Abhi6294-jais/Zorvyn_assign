const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { validate, userValidation } = require('../middleware/validation');

// All user routes require authentication and admin role
router.use(authMiddleware);
router.use(isAdmin);

router.get('/', userController.getAllUsers);
router.get('/:id', validate(userValidation.update), userController.getUserById);
router.put('/:id', validate(userValidation.update), userController.updateUser);
router.delete('/:id', validate(userValidation.update), userController.deleteUser);

module.exports = router;