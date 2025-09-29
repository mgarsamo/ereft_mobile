import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Callout, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useProperty } from '../context/PropertyContext';
import { ENV } from '../config/env';

// Google Maps API Key - Use environment configuration
const GOOGLE_MAPS_API_KEY = ENV.GOOGLE_MAPS_API_KEY;

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { properties, featuredProperties, getProperties, getFeaturedProperties } = useProperty();
  
  const [userLocation, setUserLocation] = useState(null);
  // Set default location to Addis Ababa (specific coordinates as requested)
  const [region, setRegion] = useState({
    latitude: 9.0192,
    longitude: 38.7525,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapError, setMapError] = useState(null);
  
  // Circle search disabled for now
  const [isCircleSearchMode, setIsCircleSearchMode] = useState(false);
  const [searchCircle, setSearchCircle] = useState(null);
  const [circleProperties, setCircleProperties] = useState([]);
  const [showCircleResults, setShowCircleResults] = useState(false);

  useEffect(() => {
    loadProperties();
    // Don't auto-get user location - always default to Addis Ababa
    console.log('🗺️ MapScreen: Platform:', Platform.OS);
    console.log('🗺️ MapScreen: Defaulting to Addis Ababa location');
  }, []);

  const loadProperties = async () => {
    try {
      console.log('🗺️ MapScreen: Loading properties for map display...');
      
      // Load properties from PropertyContext
      await Promise.all([
        getProperties(),
        getFeaturedProperties(),
      ]);
      
      console.log('🗺️ MapScreen: Properties loaded successfully');
    } catch (error) {
      console.error('🗺️ MapScreen: Error loading properties:', error);
      setMapError('Failed to load properties');
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show nearby properties.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setUserLocation({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Get marker color based on property type
  const getMarkerColor = (propertyType) => {
    const colorMap = {
      'house': '#006AFF',      // Blue for houses
      'apartment': '#28A745',  // Green for apartments
      'condo': '#FF6B35',      // Orange for condos
      'villa': '#9C27B0',      // Purple for villas
      'land': '#795548',       // Brown for land
      'commercial': '#FF9800', // Orange for commercial
      'townhouse': '#607D8B',  // Blue-grey for townhouses
    };
    
    return colorMap[propertyType] || '#006AFF'; // Default to blue
  };

  // Handle marker press
  const handleMarkerPress = (property) => {
    console.log('🗺️ MapScreen: Marker pressed for property:', property.id);
    setSelectedProperty(property);
  };

  // Handle property press (from callout)
  const handlePropertyPress = (property) => {
    try {
      console.log('🗺️ MapScreen: Navigating to property detail:', property.id);
      
      // Ensure we have a valid property object with required fields
      const propertyData = {
        id: property.id || Date.now(),
        title: property.title || 'Property',
        price: property.price || 0,
        location: property.location || property.address || 'Location not specified',
        address: property.address || property.location || '',
        city: property.city || 'Addis Ababa',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area_sqm: property.area_sqm || property.square_feet || 100,
        description: property.description || 'No description available',
        property_type: property.property_type || 'house',
        listing_type: property.listing_type || 'sale',
        images: property.images || [],
        latitude: property.latitude,
        longitude: property.longitude,
        owner: property.owner || {
          name: 'Property Owner',
          phone: '+251-911-123456',
          email: 'owner@example.com'
        },
        is_favorite: property.is_favorite || false,
        created_at: property.created_at || new Date().toISOString(),
        ...property
      };
      
      navigation.navigate('PropertyDetail', { 
        property: propertyData,
        propertyId: propertyData.id 
      });
    } catch (error) {
      console.error('🗺️ MapScreen: Error navigating to property detail:', error);
      Alert.alert('Error', 'Unable to view property details. Please try again.');
    }
  };

  const handleMyLocation = () => {
    if (userLocation) {
      setRegion({
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } else {
      getUserLocation();
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Auto-zoom to fit the circle area
  const zoomToCircle = (circle) => {
    if (!circle) return;
    
    // Calculate appropriate zoom level based on circle radius
    const radiusInKm = circle.radius / 1000;
    const latitudeDelta = radiusInKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const longitudeDelta = radiusInKm / (111 * Math.cos(circle.center.latitude * Math.PI / 180));
    
    // Add some padding around the circle
    const padding = 1.5;
    
    setRegion({
      latitude: circle.center.latitude,
      longitude: circle.center.longitude,
      latitudeDelta: latitudeDelta * padding,
      longitudeDelta: longitudeDelta * padding,
    });
  };

  // Simple map interaction - circle drawing disabled
  const handleMapPress = (event) => {
    // Circle drawing disabled - map is for viewing properties only
    console.log('Map pressed at:', event.nativeEvent.coordinate);
  };

  // Circle search functionality disabled
  const toggleCircleSearchMode = () => {
    Alert.alert(
      'Feature Coming Soon',
      'Circle search functionality will be available in a future update.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleMapError = (error) => {
    console.error('MapView error:', error);
    setMapError('Map error: ' + error.nativeEvent?.message || error.message);
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
      
      <Text style={styles.headerTitle}>Map View</Text>
      
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={[styles.circleSearchButton, isCircleSearchMode && styles.circleSearchButtonActive]}
          onPress={toggleCircleSearchMode}
        >
          <Icon 
            name={isCircleSearchMode ? 'close' : 'radio-button-unchecked'} 
            size={20} 
            color={isCircleSearchMode ? '#FF0000' : '#FFFFFF'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleMyLocation}
        >
          <Icon name="my-location" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPropertyCallout = (property) => (
    <Callout onPress={() => handlePropertyPress(property)}>
      <View style={styles.calloutContainer}>
        <Text style={styles.calloutTitle}>{property.title}</Text>
        <Text style={styles.calloutPrice}>{formatPrice(property.price)}</Text>
        <Text style={styles.calloutType}>
          {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)} • {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
        </Text>
        <TouchableOpacity 
          style={styles.calloutButton}
          onPress={() => handlePropertyPress(property)}
        >
          <Text style={styles.calloutButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </Callout>
  );

  const renderMapLegend = () => {
    // Count properties by type for legend
    const propertyTypeCounts = {};
    properties.forEach(property => {
      const type = property.property_type || 'house';
      propertyTypeCounts[type] = (propertyTypeCounts[type] || 0) + 1;
    });

    return (
      <View style={styles.legend}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendTitle}>Property Types</Text>
          <Text style={styles.legendSubtitle}>{properties.length} properties on map</Text>
        </View>
        <View style={styles.legendItems}>
          {Object.entries(propertyTypeCounts).map(([type, count]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getMarkerColor(type) }]} />
              <Text style={styles.legendText}>
                {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadProperties}
        >
          <Icon name="refresh" size={16} color="#006AFF" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {mapError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      )}
      
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        apiKey={GOOGLE_MAPS_API_KEY}
        mapType="standard"
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
        onError={handleMapError}
        onMapReady={() => console.log('MapScreen: Map is ready')}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            coordinate={{
              latitude: property.latitude,
              longitude: property.longitude,
            }}
            pinColor={getMarkerColor(property.property_type)}
            onPress={() => handleMarkerPress(property)}
          >
            {renderPropertyCallout(property)}
          </Marker>
        ))}
        
        {/* Circle drawing disabled */}
      </MapView>
      
      {renderHeader()}
      {renderMapLegend()}
      

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  circleSearchButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006AFF',
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#006AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  calloutButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  legendSubtitle: {
    fontSize: 12,
    color: '#6C757D',
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  refreshButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#006AFF',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    padding: 5,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 3,
  },
  resultLocation: {
    fontSize: 12,
    color: '#666',
  },
  emptyResults: {
    padding: 40,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  clearSearchButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapScreen;
