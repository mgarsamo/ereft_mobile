import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProperty } from '../context/PropertyContext';

const FeaturedScreen = () => {
  const navigation = useNavigation();
  const { getSafeProperties, getSafeFeaturedProperties } = useProperty();
  
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      setError(null);
      
      // Use safe functions to ensure we always have data
      const properties = getSafeProperties();
      const featured = getSafeFeaturedProperties();
      
      // Filter for featured properties or use the featured properties directly
      let finalFeatured = [];
      
      if (properties && Array.isArray(properties)) {
        finalFeatured = properties.filter(p => p.is_featured) || [];
      }
      
      // If no featured properties found, use the featured properties from context
      if (finalFeatured.length === 0 && featured && Array.isArray(featured)) {
        finalFeatured = featured;
      }
      
      // If still no featured properties, use mock data
      if (finalFeatured.length === 0) {
        finalFeatured = [
          {
            id: '1',
            title: 'Luxury Villa in Bole',
            price: 4500000,
            location: 'Bole, Addis Ababa',
            area_sqm: 350,
            bedrooms: 5,
            bathrooms: 4,
            property_type: 'house',
            listing_type: 'sale',
            is_featured: true,
          },
          {
            id: '2',
            title: 'Modern Penthouse in Kazanchis',
            price: 3800000,
            location: 'Kazanchis, Addis Ababa',
            area_sqm: 280,
            bedrooms: 4,
            bathrooms: 3,
            property_type: 'apartment',
            listing_type: 'sale',
            is_featured: true,
          },
          {
            id: '3',
            title: 'Premium Office Space in CMC',
            price: 6200000,
            location: 'CMC, Addis Ababa',
            area_sqm: 500,
            bedrooms: 0,
            bathrooms: 2,
            property_type: 'commercial',
            listing_type: 'sale',
            is_featured: true,
          },
        ];
      }
      
      setFeaturedProperties(finalFeatured);
    } catch (err) {
      console.error('Error loading featured properties:', err);
      setError('Failed to load featured properties');
      setFeaturedProperties([]); // Show empty state instead of crashing
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedProperties();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePropertyPress = (property) => {
    navigation.navigate('PropertyDetail', { property });
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(item)}
    >
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Icon name="home" size={40} color="#E9ECEF" />
        </View>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
      </View>
      
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.propertyPrice}>
          {formatPrice(item.price)}
        </Text>
        <Text style={styles.propertyLocation}>
          <Icon name="location-on" size={14} color="#6C757D" />
          {' '}{item.location}
        </Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetailText}>
            {item.bedrooms > 0 ? `${item.bedrooms} bed • ` : ''}
            {item.bathrooms > 0 ? `${item.bathrooms} bath • ` : ''}
            {item.area_sqm} m²
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="star-outline" size={64} color="#E9ECEF" />
      <Text style={styles.emptyStateTitle}>No Featured Properties</Text>
      <Text style={styles.emptyStateText}>
        Check back later for featured listings
      </Text>
      <TouchableOpacity
        style={styles.browseAllButton}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.browseAllText}>Browse All Properties</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Icon name="error-outline" size={64} color="#DC3545" />
      <Text style={styles.emptyStateTitle}>Error Loading Properties</Text>
      <Text style={styles.emptyStateText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={loadFeaturedProperties}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Featured Properties</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006AFF" />
          <Text style={styles.loadingText}>Loading featured properties...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Featured Properties</Text>
      </View>

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={featuredProperties}
          renderItem={renderProperty}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#006AFF',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyDetailText: {
    fontSize: 12,
    color: '#6C757D',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseAllButton: {
    backgroundColor: '#006AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeaturedScreen;
