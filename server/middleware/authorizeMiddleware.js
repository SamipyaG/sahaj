
const authorize = (allowedRoles = [], allowSelf = false) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Check if user has one of the allowed roles
      const hasRole = allowedRoles.includes(req.user.role);
      
      // If allowSelf is true, check if user is accessing their own data
      let isSelf = false;
      if (allowSelf && req.params.id) {
        isSelf = req.params.id === req.user.id || 
                 req.params.id === req.user.employeeId;
      }

      // Grant access if user has role or is accessing their own data (when allowed)
      if (hasRole || isSelf) {
        return next();
      }

      // If no access granted
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to access this resource' 
      });

    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error during authorization' 
      });
    }
  };
};

export default authorize;