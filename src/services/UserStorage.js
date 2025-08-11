import AsyncStorage from '@react-native-async-storage/async-storage';

// User storage service for managing registered users locally
class UserStorage {
  static USERS_KEY = 'ereft_registered_users';
  static CURRENT_USER_KEY = 'ereft_current_user';

  // Get all registered users
  static async getAllUsers() {
    try {
      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Save a new user
  static async saveUser(userData) {
    try {
      const users = await this.getAllUsers();
      
      // Check if user already exists
      const existingUser = users.find(user => 
        user.username === userData.username || user.email === userData.email
      );
      
      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }

      // Create new user with unique ID
      const newUser = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name || userData.username,
        last_name: userData.last_name || 'User',
        password: userData.password, // In production, this should be hashed
        profile_picture: null,
        created_at: new Date().toISOString(),
        is_active: true,
        // User stats - all fields initialized to 0
        total_listings: 0,
        active_listings: 0,
        pending_review: 0,
        favorites_count: 0,
        views_total: 0,
        messages_unread: 0,
        properties_sold: 0,
        recent_views: 0
      };

      users.push(newUser);
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      return newUser;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  // Find user by username and password
  static async authenticateUser(username, password) {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => 
        (u.username === username || u.email === username) && u.password === password
      );
      
      if (user) {
        // Don't return password in the user object
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  // Update user data
  static async updateUser(userId, updateData) {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex] = { ...users[userIndex], ...updateData };
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = users[userIndex];
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user stats
  static async updateUserStats(userId, statsUpdate) {
    try {
      const users = await this.getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Update only the stats fields
      users[userIndex] = { 
        ...users[userIndex], 
        ...statsUpdate,
        // Ensure these fields exist and are numbers
        total_listings: (users[userIndex].total_listings || 0) + (statsUpdate.total_listings || 0),
        active_listings: (users[userIndex].active_listings || 0) + (statsUpdate.active_listings || 0),
        pending_review: (users[userIndex].pending_review || 0) + (statsUpdate.pending_review || 0),
        favorites_count: (users[userIndex].favorites_count || 0) + (statsUpdate.favorites_count || 0),
        views_total: (users[userIndex].views_total || 0) + (statsUpdate.views_total || 0),
        messages_unread: (users[userIndex].messages_unread || 0) + (statsUpdate.messages_unread || 0),
        properties_sold: (users[userIndex].properties_sold || 0) + (statsUpdate.properties_sold || 0),
        recent_views: (users[userIndex].recent_views || 0) + (statsUpdate.recent_views || 0),
      };
      
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = users[userIndex];
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const users = await this.getAllUsers();
      const user = users.find(u => u.id === userId);
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Check if username or email exists
  static async userExists(username, email) {
    try {
      const users = await this.getAllUsers();
      return users.some(user => 
        user.username === username || user.email === email
      );
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  // Generate auth token for user
  static generateAuthToken(userId) {
    return `ereft_token_${userId}_${Date.now()}`;
  }

  // Initialize with demo users if no users exist
  static async initializeDemoUsers() {
    try {
      const users = await this.getAllUsers();
      
      if (users.length === 0) {
        // Create demo users
        const demoUsers = [
          {
            id: 1,
            username: 'demo',
            email: 'demo@ereft.com',
            first_name: 'Demo',
            last_name: 'User',
            password: 'demo123',
            profile_picture: null,
            created_at: new Date().toISOString(),
            is_active: true,
            total_listings: 5,
            active_listings: 3,
            pending_review: 1,
            favorites_count: 8,
            views_total: 124,
            messages_unread: 2,
            properties_sold: 2,
            recent_views: 15
          },
          {
            id: 2,
            username: 'admin',
            email: 'admin@ereft.com',
            first_name: 'Admin',
            last_name: 'User',
            password: 'admin123',
            profile_picture: null,
            created_at: new Date().toISOString(),
            is_active: true,
            is_staff: true,
            total_listings: 15,
            active_listings: 12,
            pending_review: 3,
            favorites_count: 3,
            views_total: 856,
            messages_unread: 0,
            properties_sold: 8,
            recent_views: 45
          }
        ];

        await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(demoUsers));
        console.log('Demo users initialized');
      }
    } catch (error) {
      console.error('Error initializing demo users:', error);
    }
  }
}

export default UserStorage;
