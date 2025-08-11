import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  Switch,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useProperty } from '../context/PropertyContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, updateProfile, getUserStats } = useAuth();
  const { propertyStats } = useProperty();
  
  const [profileData, setProfileData] = useState({
    username: user?.username || 'admin',
    email: user?.email || 'admin@ereft.com',
    phone: user?.phone || '+251 911 123 456',
    fullName: user?.fullName || 'Admin User',
    bio: user?.bio || 'Property enthusiast and investor.',
    location: user?.location || 'Addis Ababa, Ethiopia',
    profileImage: user?.profileImage || null,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [notifications, setNotifications] = useState({
    newListings: true,
    priceChanges: true,
    favorites: true,
    messages: true,
  });

  // Real user stats from backend
  const [userStats, setUserStats] = useState({
    total_listings: 0,
    active_listings: 0,
    pending_review: 0,
    favorites_count: 0,
    views_total: 0,
    messages_unread: 0,
    properties_sold: 0,
    recent_views: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load real user stats on component mount
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await getUserStats();
      if (stats) {
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Keep the current stats (they should be zeros by default)
    } finally {
      setStatsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity onPress={() => setSettingsVisible(true)}>
        <Icon name="settings" size={24} color="#1A1A1A" />
      </TouchableOpacity>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={handleImagePicker}>
          {profileData.profileImage ? (
            <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Icon name="person" size={50} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.editImageButton}>
            <Icon name="camera-alt" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.userName}>{profileData.fullName}</Text>
      <Text style={styles.userEmail}>{profileData.email}</Text>
      <Text style={styles.userLocation}>
        <Icon name="location-on" size={16} color="#6C757D" />
        {' '}{profileData.location}
      </Text>
      
      {profileData.bio && (
        <Text style={styles.userBio}>{profileData.bio}</Text>
      )}
      
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => setEditModalVisible(true)}
      >
        <Icon name="edit" size={18} color="#006AFF" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Activity Stats</Text>
      {statsLoading ? (
        <View style={styles.loadingStats}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.total_listings}</Text>
            <Text style={styles.statLabel}>Total Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.active_listings}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.favorites_count}</Text>
            <Text style={styles.statLabel}>Saved Properties</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.views_total}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.pending_review}</Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userStats.properties_sold}</Text>
            <Text style={styles.statLabel}>Sold/Rented</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderMenuItems = () => (
    <View style={styles.menuSection}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('Favorites')}
      >
        <View style={styles.menuItemLeft}>
          <Icon name="favorite" size={24} color="#FF6B35" />
          <Text style={styles.menuItemText}>Saved Properties</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#6C757D" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('Search')}
      >
        <View style={styles.menuItemLeft}>
          <Icon name="history" size={24} color="#28A745" />
          <Text style={styles.menuItemText}>Search History</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#6C757D" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('AddProperty')}
      >
        <View style={styles.menuItemLeft}>
          <Icon name="add" size={24} color="#6F42C1" />
          <Text style={styles.menuItemText}>My Listings</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#6C757D" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => setSettingsVisible(true)}
      >
        <View style={styles.menuItemLeft}>
          <Icon name="settings" size={24} color="#007BFF" />
          <Text style={styles.menuItemText}>Settings</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#6C757D" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => Alert.alert('Help', 'Contact support at support@ereft.com')}
      >
        <View style={styles.menuItemLeft}>
          <Icon name="help" size={24} color="#17A2B8" />
          <Text style={styles.menuItemText}>Help & Support</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#6C757D" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.logoutItem]}
        onPress={handleLogout}
      >
        <View style={styles.menuItemLeft}>
          <Icon name="logout" size={24} color="#DC3545" />
          <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#DC3545" />
      </TouchableOpacity>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditModalVisible(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSaveProfile}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.fullName}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, fullName: text }))}
              placeholder="Enter your full name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={profileData.email}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profileData.phone}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              value={profileData.location}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
              placeholder="Enter your location"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profileData.bio}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal
      visible={settingsVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setSettingsVisible(false)}>
            <Text style={styles.modalCancel}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.settingsSection}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>New Listings</Text>
            <Switch
              value={notifications.newListings}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, newListings: value }))}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Price Changes</Text>
            <Switch
              value={notifications.priceChanges}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, priceChanges: value }))}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Favorites Updates</Text>
            <Switch
              value={notifications.favorites}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, favorites: value }))}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Messages</Text>
            <Switch
              value={notifications.messages}
              onValueChange={(value) => setNotifications(prev => ({ ...prev, messages: value }))}
            />
          </View>
          
          <Text style={styles.settingsSection}>Account</Text>
          
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingButton}>
            <Text style={styles.settingButtonText}>Privacy Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingButton, styles.dangerButton]}>
            <Text style={[styles.settingButtonText, styles.dangerText]}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#006AFF']}
            tintColor="#006AFF"
          />
        }
      >
        {renderProfileInfo()}
        {renderStats()}
        {renderMenuItems()}
      </ScrollView>
      {renderEditModal()}
      {renderSettingsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C757D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 5,
  },
  userLocation: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 15,
  },
  userBio: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#006AFF',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#006AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 15,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#DC3545',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6C757D',
  },
  modalSave: {
    fontSize: 16,
    color: '#006AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingsSection: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  settingButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#006AFF',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#DC3545',
  },
  loadingStats: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
});

export default ProfileScreen;