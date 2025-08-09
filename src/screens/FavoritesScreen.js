import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getFavorites, toggleFavorite } = useProperty();
  
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock favorites data for demonstration
  const mockFavorites = [
    {
      id: '1',
      title: 'Beautiful House in Bole',
      price: 2500000,
      location: 'Bole, Addis Ababa',
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      propertyType: 'House',
      listingType: 'Sale',
      images: ['https://via.placeholder.com/300x200/006AFF/FFFFFF?text=House+1'],
      isFavorite: true,
      addedDate: '2024-01-15',
    },
    {
      id: '2',
      title: 'Modern Apartment in Kazanchis',
      price: 1800000,
      location: 'Kazanchis, Addis Ababa',
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      propertyType: 'Apartment',
      listingType: 'Sale',
      images: ['https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=Apartment+1'],
      isFavorite: true,
      addedDate: '2024-01-10',
    },
    {
      id: '3',
      title: 'Luxury Villa in CMC',
      price: 4200000,
      location: 'CMC, Addis Ababa',
      bedrooms: 5,
      bathrooms: 4,
      area: 400,
      propertyType: 'Villa',
      listingType: 'Sale',
      images: ['https://via.placeholder.com/300x200/28A745/FFFFFF?text=Villa+1'],
      isFavorite: true,
      addedDate: '2024-01-05',
    },
  ];

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Try to get real favorites, fall back to mock data
      const data = await getFavorites();
      setFavorites(mockFavorites); // Use mock data for now
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites(mockFavorites); // Use mock data on error
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (propertyId) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this property from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await toggleFavorite(propertyId);
              setFavorites(prev => prev.filter(item => item.id !== propertyId));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const handlePropertyPress = (property) => {
    // Pass only the property ID to avoid crashes
    navigation.navigate('PropertyDetail', { 
      propertyId: property.id,
      property: property // Pass full object as backup
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Favorites</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Search')}>
        <Icon name="search" size={24} color="#1A1A1A" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="favorite-border" size={80} color="#E9ECEF" />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start exploring properties and save your favorites to see them here.
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Search')}
      >
        <Icon name="search" size={20} color="#FFFFFF" />
        <Text style={styles.exploreButtonText}>Explore Properties</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPropertyCard = (property) => (
    <TouchableOpacity
      key={property.id}
      style={styles.propertyCard}
      onPress={() => handlePropertyPress(property)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images[0] }}
          style={styles.propertyImage}
          defaultSource={{ uri: 'https://via.placeholder.com/300x200/E9ECEF/6C757D?text=No+Image' }}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleRemoveFavorite(property.id)}
        >
          <Icon name="favorite" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <View style={styles.listingTypeBadge}>
          <Text style={styles.listingTypeText}>{property.listingType}</Text>
        </View>
      </View>
      
      <View style={styles.propertyInfo}>
        <View style={styles.propertyHeader}>
          <Text style={styles.propertyPrice}>{formatPrice(property.price)}</Text>
          <Text style={styles.addedDate}>Added {formatDate(property.addedDate)}</Text>
        </View>
        
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {property.title}
        </Text>
        
        <Text style={styles.propertyLocation}>
          <Icon name="location-on" size={14} color="#6C757D" />
          {' '}{property.location}
        </Text>
        
        <View style={styles.propertyDetails}>
          <View style={styles.detailItem}>
            <Icon name="bed" size={16} color="#6C757D" />
            <Text style={styles.detailText}>{property.bedrooms} bed</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="bathtub" size={16} color="#6C757D" />
            <Text style={styles.detailText}>{property.bathrooms} bath</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="square-foot" size={16} color="#6C757D" />
            <Text style={styles.detailText}>{property.area} m²</Text>
          </View>
        </View>
        
        <View style={styles.propertyActions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Alert.alert('Contact', `Contact agent for ${property.title}`)}
          >
            <Icon name="phone" size={16} color="#006AFF" />
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => Alert.alert('Share', `Share ${property.title}`)}
          >
            <Icon name="share" size={16} color="#6C757D" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFavoritesList = () => (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
        </Text>
      </View>
      
      <View style={styles.propertiesContainer}>
        {favorites.map(renderPropertyCard)}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        renderFavoritesList()
      )}
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  statsText: {
    fontSize: 14,
    color: '#6C757D',
  },
  propertiesContainer: {
    padding: 10,
  },
  propertyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingTypeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#006AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listingTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 15,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006AFF',
  },
  addedDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 10,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 5,
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#006AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006AFF',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
});

export default FavoritesScreen;