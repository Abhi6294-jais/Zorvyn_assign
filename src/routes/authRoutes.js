const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validate, userValidation } = require('../middleware/validation');

router.post('/register', validate(userValidation.register), authController.register);
router.post('/login', validate(userValidation.login), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;