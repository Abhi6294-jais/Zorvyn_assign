const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

class UserService {
  /**
   * Create a new user
   */
  async createUser(userData) {
    const { email, password, name, role } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'viewer',
      status: 'active'
    });
    
    // Return user without password
    return this.sanitizeUser(user);
  }
  
  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    const user = await User.findOne({ email });
    return user;
  }
  
  /**
   * Find user by ID
   */
  async findUserById(userId) {
    const user = await User.findById(userId).select('-password');
    return user;
  }
  
  /**
   * Validate user credentials
   */
  async validateCredentials(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return null;
    }
    
    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }
    
    return this.sanitizeUser(user);
  }
  
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(filters = {}, pagination = {}) {
    const { status, role } = filters;
    const { page = 1, limit = 10 } = pagination;
    
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);
    
    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Update user by ID
   */
  async updateUser(userId, updateData) {
    const { name, role, status } = updateData;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        name, 
        role, 
        status, 
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  /**
   * Delete user by ID
   */
  async deleteUser(userId) {
    // Delete user's refresh tokens first
    await RefreshToken.deleteMany({ userId });
    
    // Delete user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    user.password = newPassword;
    await user.save();
    
    return true;
  }
  
  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(userId, status) {
    if (!['active', 'inactive'].includes(status)) {
      throw new Error('Invalid status');
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // If deactivating, delete all refresh tokens
    if (status === 'inactive') {
      await RefreshToken.deleteMany({ userId });
    }
    
    return user;
  }
  
  /**
   * Get user statistics
   */
  async getUserStatistics() {
    const [totalUsers, activeUsers, roleStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const roleDistribution = {};
    roleStats.forEach(stat => {
      roleDistribution[stat._id] = stat.count;
    });
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution
    };
  }
  
  /**
   * Sanitize user object (remove sensitive data)
   */
  sanitizeUser(user) {
    const userObject = user.toObject ? user.toObject() : user;
    delete userObject.password;
    return userObject;
  }
  
  /**
   * Check if user has permission for action
   */
  hasPermission(userRole, requiredRoles) {
    return requiredRoles.includes(userRole);
  }
  
  /**
   * Get users by role
   */
  async getUsersByRole(role) {
    const users = await User.find({ role, status: 'active' })
      .select('name email createdAt')
      .sort({ name: 1 });
    return users;
  }
  
  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm, limit = 10) {
    const searchRegex = new RegExp(searchTerm, 'i');
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ],
      status: 'active'
    })
    .select('name email role')
    .limit(limit);
    
    return users;
  }
}

module.exports = new UserService();