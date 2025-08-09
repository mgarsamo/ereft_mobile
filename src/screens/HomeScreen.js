import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSearch = (query) => {
    navigation.navigate('Search', { query });
  };

  const handlePropertyPress = (property) => {
    navigation.navigate('PropertyDetail', { property });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWithIcon}>
            <Icon name="home" size={28} color="#000000" style={styles.logoIcon} />
            <Text style={styles.logo}>Ereft</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Main map icon - now functional like Quick Action map */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Icon name="map" size={24} color="#006AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddProperty')}
          >
            <Icon name="add" size={24} color="#006AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.searchBar} onPress={() => handleSearch('')}>
        <Icon name="search" size={20} color="#6C757D" />
        <Text style={styles.searchText}>Search by address, city, or ZIP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeText}>
        Welcome back, {user?.first_name || user?.username || 'User'}!
      </Text>
      <Text style={styles.welcomeSubtext}>
        Find your perfect home in Ethiopia
      </Text>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Market Overview</Text>
      <View style={styles.statsContainer}>
        {/* All Market Overview icons are now functional - showing 0 until real data is available */}
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Search', { query: 'all properties' })}
        >
          <Icon name="home" size={24} color="#006AFF" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Search', { type: 'sale' })}
        >
          <Icon name="home" size={24} color="#28A745" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>For Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('Search', { type: 'rent' })}
        >
          <Icon name="apartment" size={24} color="#FF6B35" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>For Rent</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoriesSection = () => {
    // Property type icons reordered: Home, Apartment, Condo, Land, Commercial, Townhouse (Townhouse last)
    const propertyTypes = [
      { name: 'Home', icon: 'home' },
      { name: 'Apartment', icon: 'apartment' },
      { name: 'Condo', icon: 'business' },
      { name: 'Land', icon: 'landscape' },
      { name: 'Commercial', icon: 'store' },
      { name: 'Townhouse', icon: 'domain' }
    ];

    return (
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Browse by Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {/* All property type icons are now functional - returning empty results until listings exist */}
          {propertyTypes.map((propertyType) => (
            <TouchableOpacity 
              key={propertyType.name} 
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Search', { 
                propertyType: propertyType.name.toLowerCase(),
                query: propertyType.name 
              })}
            >
              <View style={styles.categoryIcon}>
                <Icon name={propertyType.icon} size={24} color="#006AFF" />
              </View>
              <Text style={styles.categoryText}>{propertyType.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedSection = () => {
    const featuredProperties = [
      {
        id: '1',
        title: 'Beautiful House in Bole',
        price: 2500000,
        location: 'Bole, Addis Ababa',
        bedrooms: 4,
        bathrooms: 3,
        area_sqm: 250,
        image: 'https://via.placeholder.com/250x180/006AFF/FFFFFF?text=House+1',
        isFeatured: true,
      },
      {
        id: '2',
        title: 'Modern Apartment in Kazanchis',
        price: 1800000,
        location: 'Kazanchis, Addis Ababa',
        bedrooms: 3,
        bathrooms: 2,
        area_sqm: 180,
        image: 'https://via.placeholder.com/250x180/FF6B35/FFFFFF?text=Apartment+1',
        isFeatured: true,
      },
      {
        id: '3',
        title: 'Luxury Villa in CMC',
        price: 4200000,
        location: 'CMC, Addis Ababa',
        bedrooms: 5,
        bathrooms: 4,
        area_sqm: 400,
        image: 'https://via.placeholder.com/250x180/28A745/FFFFFF?text=Villa+1',
        isFeatured: true,
      },
    ];

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
      }).format(price);
    };

    return (
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Properties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Featured')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
        >
          {featuredProperties.map((property) => (
            <TouchableOpacity 
              key={property.id} 
              style={styles.featuredCard}
              onPress={() => handlePropertyPress(property)}
            >
              <View style={styles.featuredImageContainer}>
                <View style={styles.featuredImagePlaceholder}>
                  <Icon name="home" size={40} color="#E9ECEF" />
                </View>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {property.title}
                </Text>
                <Text style={styles.featuredPrice}>
                  {formatPrice(property.price)}
                </Text>
                <Text style={styles.featuredLocation}>
                  <Icon name="location-on" size={14} color="#6C757D" />
                  {' '}{property.location}
                </Text>
                <View style={styles.featuredDetails}>
                  <Text style={styles.featuredDetailText}>
                    {property.bedrooms} bed • {property.bathrooms} bath • {property.area_sqm} m²
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Search', { type: 'sale' })}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#28A745' }]}>
            <Icon name="home" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>Buy</Text>
        </TouchableOpacity>
        
        {/* Added Rent icon to Quick Actions with placeholder functionality */}
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Search', { type: 'rent' })}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FF6B35' }]}>
            <Icon name="apartment" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>Rent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Map')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#006AFF' }]}>
            <Icon name="map" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>Map</Text>
        </TouchableOpacity>
        
        {/* Renamed Sell to List - functionality remains the same */}
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#6F42C1' }]}>
            <Icon name="add" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderWelcomeSection()}
        {renderStatsSection()}
        {renderCategoriesSection()}
        {renderFeaturedSection()}
        {renderQuickActions()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006AFF',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchText: {
    fontSize: 16,
    color: '#6C757D',
    marginLeft: 12,
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#6C757D',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
  categoriesSection: {
    paddingVertical: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  featuredSection: {
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 16,
    color: '#006AFF',
    fontWeight: '600',
  },
  featuredContainer: {
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImageContainer: {
    position: 'relative',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredInfo: {
    padding: 15,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 20,
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006AFF',
    marginBottom: 5,
  },
  featuredLocation: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  featuredDetails: {
    marginTop: 5,
  },
  featuredDetailText: {
    fontSize: 12,
    color: '#6C757D',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
