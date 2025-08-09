import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FastImage from 'react-native-fast-image';
import { useProperty } from '../context/PropertyContext';

const { width } = Dimensions.get('window');

const PropertyCard = ({ property, onPress, style, showFavorite = true }) => {
  const { toggleFavorite } = useProperty();

  const handleFavoritePress = async (e) => {
    e.stopPropagation();
    try {
      await toggleFavorite(property.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeIcon = (type) => {
    const icons = {
      house: 'home',
      apartment: 'apartment',
      condo: 'apartment',
      townhouse: 'home',
      land: 'landscape',
      commercial: 'business',
      other: 'home',
    };
    return icons[type] || 'home';
  };

  const getListingTypeColor = (type) => {
    const colors = {
      sale: '#28A745',
      rent: '#FF6B35',
      sold: '#6C757D',
      pending: '#FFC107',
    };
    return colors[type] || '#6C757D';
  };

  const getListingTypeText = (type) => {
    const texts = {
      sale: 'For Sale',
      rent: 'For Rent',
      sold: 'Sold',
      pending: 'Pending',
    };
    return texts[type] || type;
  };

  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
      <View style={styles.imageContainer}>
        {property.primary_image ? (
          <FastImage
            source={{ uri: property.primary_image }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="home" size={40} color="#E9ECEF" />
          </View>
        )}
        
        <View style={styles.imageOverlay}>
          <View style={[styles.listingTypeBadge, { backgroundColor: getListingTypeColor(property.listing_type) }]}>
            <Text style={styles.listingTypeText}>
              {getListingTypeText(property.listing_type)}
            </Text>
          </View>
          
          {showFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
            >
              <Icon
                name={property.is_favorited ? 'favorite' : 'favorite-border'}
                size={24}
                color={property.is_favorited ? '#DC3545' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          {property.price_per_sqm && (
            <Text style={styles.pricePerSqm}>
              {formatPrice(property.price_per_sqm)}/m²
            </Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Icon name="bed" size={16} color="#6C757D" />
            <Text style={styles.detailText}>{property.bedrooms} bed</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Icon name="bathtub" size={16} color="#6C757D" />
            <Text style={styles.detailText}>{property.bathrooms} bath</Text>
          </View>
          
          {property.area_sqm && (
            <View style={styles.detailItem}>
              <Icon name="straighten" size={16} color="#6C757D" />
              <Text style={styles.detailText}>
                {property.area_sqm.toLocaleString()} m²
              </Text>
            </View>
          )}
        </View>

        <View style={styles.locationContainer}>
          <Icon name="location-on" size={14} color="#6C757D" />
          <Text style={styles.location} numberOfLines={1}>
            {property.address}, {property.city}
          </Text>
        </View>

        <View style={styles.propertyTypeContainer}>
          <Icon name={getPropertyTypeIcon(property.property_type)} size={14} color="#6C757D" />
          <Text style={styles.propertyType}>
            {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
          </Text>
        </View>

        {property.is_featured && (
          <View style={styles.featuredBadge}>
            <Icon name="star" size={12} color="#FFC107" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  listingTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listingTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 8,
  },
  pricePerSqm: {
    fontSize: 14,
    color: '#6C757D',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 22,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
    flex: 1,
  },
  propertyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyType: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default PropertyCard;
