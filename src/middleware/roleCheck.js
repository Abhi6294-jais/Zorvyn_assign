const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role does not have permission for this action.`,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

// Specific role check helpers
const isAdmin = roleCheck('admin');
const isAdminOrAnalyst = roleCheck('admin', 'analyst');
const isAuthenticated = roleCheck('viewer', 'analyst', 'admin');

module.exports = {
  roleCheck,
  isAdmin,
  isAdminOrAnalyst,
  isAuthenticated
};