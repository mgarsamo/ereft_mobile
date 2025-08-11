import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useProperty } from '../context/PropertyContext';

const { width, height } = Dimensions.get('window');

const PropertyDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { toggleFavorite, contactAgent, getPropertyDetails } = useProperty();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default property data in case of loading issues
  const defaultProperty = {
    id: route.params?.propertyId || '1',
    title: 'Beautiful 3-Bedroom House in Addis Ababa',
    description: 'This stunning 3-bedroom house is located in the heart of Addis Ababa. Features include a modern kitchen, spacious living room, and beautiful garden. Perfect for families looking for comfort and style.',
    price: 2500000,
    bedrooms: 3,
    bathrooms: 2.5,
    area_sqm: 180,
    address: 'Bole, Addis Ababa',
    city: 'Addis Ababa',
    sub_city: 'Bole',
    kebele: '03',
    property_type: 'house',
    listing_type: 'sale',
    is_favorite: false,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    features: {
      has_garage: true,
      has_pool: false,
      has_garden: true,
      has_balcony: true,
      is_furnished: false,
      has_air_conditioning: true,
      has_heating: true,
    },
    owner: {
      name: 'John Doe',
      phone: '+251911234567',
      email: 'john@example.com',
    },
    views_count: 45,
    created_at: '2024-01-15',
  };
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load property data on component mount
  useEffect(() => {
    loadPropertyData();
  }, []);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If property is passed in route params, use it
      if (route.params?.property) {
        setProperty(route.params.property);
        setIsFavorite(route.params.property.is_favorite || false);
      } 
      // If only propertyId is passed, fetch from API
      else if (route.params?.propertyId && getPropertyDetails) {
        const propertyData = await getPropertyDetails(route.params.propertyId);
        setProperty(propertyData);
        setIsFavorite(propertyData.is_favorite || false);
      }
      // Fallback to default property
      else {
        setProperty(defaultProperty);
        setIsFavorite(false);
      }
    } catch (error) {
      console.error('Error loading property:', error);
      setError('Failed to load property details');
      setProperty(defaultProperty);
      setIsFavorite(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      await toggleFavorite(property.id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleContactAgent = () => {
    Alert.alert(
      'Contact Agent',
      `Call ${property.owner.name} at ${property.owner.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => contactAgent(property.id) },
      ]
    );
  };

  const handleViewOnMap = () => {
    navigation.navigate('Map', { property });
  };

  const formatPrice = (price) => {
    return `ETB ${price.toLocaleString()}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleFavoriteToggle}
        >
          <Icon 
            name={isFavorite ? "favorite" : "favorite-border"} 
            size={24} 
            color={isFavorite ? "#FF6B6B" : "#FFFFFF"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="share" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImageGallery = () => {
    // Safety check for property and images
    if (!property || !property.images || !Array.isArray(property.images) || property.images.length === 0) {
      return (
        <View style={styles.imageContainer}>
          <View style={styles.noImageContainer}>
            <Icon name="image" size={60} color="#6C757D" />
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {property.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.propertyImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        <View style={styles.imageIndicator}>
          {property.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicatorDot,
                index === currentImageIndex && styles.activeIndicatorDot
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderPropertyInfo = () => (
    <View style={styles.propertyInfo}>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(property?.price || 0)}</Text>
        <Text style={styles.priceType}>
          {property?.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
        </Text>
      </View>
      
      <Text style={styles.title}>{property?.title || 'Property Details'}</Text>
      <Text style={styles.address}>{property?.address || 'Address not available'}</Text>
      
      <View style={styles.basicInfo}>
        <View style={styles.infoItem}>
          <Icon name="bed" size={20} color="#006AFF" />
          <Text style={styles.infoText}>{property?.bedrooms || 0} Beds</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="bathtub" size={20} color="#006AFF" />
          <Text style={styles.infoText}>{property?.bathrooms || 0} Baths</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="square-foot" size={20} color="#006AFF" />
          <Text style={styles.infoText}>{property?.area_sqm || 0} m²</Text>
        </View>
      </View>
    </View>
  );

  const renderDescription = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.description}>{property?.description || 'No description available'}</Text>
    </View>
  );

  const renderFeatures = () => {
    // Ensure we have property and features data
    if (!property || !property.features || typeof property.features !== 'object') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.noDataText}>Feature information not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          {Object.entries(property.features).map(([feature, hasFeature]) => (
            <View key={feature} style={styles.featureItem}>
              <Icon 
                name={hasFeature ? "check-circle" : "cancel"} 
                size={20} 
                color={hasFeature ? "#28A745" : "#DC3545"} 
              />
              <Text style={styles.featureText}>
                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>
      <View style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{property?.owner?.name || 'Property Owner'}</Text>
          <Text style={styles.contactPhone}>{property?.owner?.phone || 'Phone not available'}</Text>
          <Text style={styles.contactEmail}>{property?.owner?.email || 'Email not available'}</Text>
        </View>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactAgent}>
          <Icon name="phone" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.primaryButton]}
        onPress={handleContactAgent}
      >
        <Icon name="phone" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Contact Agent</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={handleViewOnMap}
      >
        <Icon name="map" size={20} color="#006AFF" />
        <Text style={styles.secondaryButtonText}>View on Map</Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPropertyData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show property details (only if property is loaded)
  if (!property) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderPropertyInfo()}
        {renderDescription()}
        {renderFeatures()}
        {renderContactInfo()}
      </ScrollView>
      
      {renderHeader()}
      {renderActionButtons()}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  propertyImage: {
    width: width,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicatorDot: {
    backgroundColor: '#FFFFFF',
  },
  propertyInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 10,
  },
  priceType: {
    fontSize: 16,
    color: '#006AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 15,
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#006AFF',
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6C757D',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#006AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#006AFF',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#006AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#006AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 20,
  },
  noImageText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
});

export default PropertyDetailScreen;
