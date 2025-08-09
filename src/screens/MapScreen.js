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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useProperty } from '../context/PropertyContext';

// Google Maps API Key - iOS and Android keys
const GOOGLE_MAPS_API_KEY = Platform.OS === 'ios' 
  ? 'AIzaSyA4-mia5UmIz5P3Nfq4pc9sbx19oco1uIg'  // iOS key
  : 'AIzaSyDP555TCXanSp5coUl7jMfAiF76NfUCIvc'; // Android key

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { getProperties } = useProperty();
  
  const [properties, setProperties] = useState([]);
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

  useEffect(() => {
    loadProperties();
    getUserLocation();
    console.log('MapScreen: API Key:', GOOGLE_MAPS_API_KEY);
    console.log('MapScreen: Platform:', Platform.OS);
  }, []);

  const loadProperties = async () => {
    try {
      const data = await getProperties();
      // Real properties with coordinates for Ethiopia
      const mockProperties = [
        {
          id: '1',
          title: 'Beautiful House in Bole',
          price: 2500000,
          latitude: 9.0192,
          longitude: 38.7525,
          property_type: 'house',
          listing_type: 'sale',
          address: 'Bole, Addis Ababa',
        },
        {
          id: '2',
          title: 'Modern Apartment in Kazanchis',
          price: 1800000,
          latitude: 9.0272,
          longitude: 38.7469,
          property_type: 'apartment',
          listing_type: 'sale',
          address: 'Kazanchis, Addis Ababa',
        },
        {
          id: '3',
          title: 'Luxury Villa in Kazanchis',
          price: 4500000,
          latitude: 9.0272,
          longitude: 38.7369,
          property_type: 'house',
          listing_type: 'sale',
          address: 'Kazanchis, Addis Ababa',
        },
        {
          id: '4',
          title: 'Cozy Condo in Piassa',
          price: 1200000,
          latitude: 9.0329,
          longitude: 38.7489,
          property_type: 'condo',
          listing_type: 'rent',
          address: 'Piassa, Addis Ababa',
        },
        {
          id: '5',
          title: 'Spacious Family Home in Gerji',
          price: 3200000,
          latitude: 9.0250,
          longitude: 38.7650,
          property_type: 'house',
          listing_type: 'sale',
          address: 'Gerji, Addis Ababa',
        },
        {
          id: '6',
          title: 'Modern Office Space in Meskel Square',
          price: 2800000,
          latitude: 9.0234,
          longitude: 38.7456,
          property_type: 'commercial',
          listing_type: 'sale',
          address: 'Meskel Square, Addis Ababa',
        },
      ];
      setProperties(mockProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
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

  const handleMarkerPress = (property) => {
    setSelectedProperty(property);
  };

  const handlePropertyPress = (property) => {
    navigation.navigate('PropertyDetail', { property });
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

  const handleMapError = (error) => {
    console.error('MapView error:', error);
    setMapError('Map error: ' + error.nativeEvent?.message || error.message);
  };

  const formatPrice = (price) => {
    return `ETB ${price.toLocaleString()}`;
  };

  const getMarkerColor = (propertyType) => {
    switch (propertyType) {
      case 'house':
        return '#006AFF';
      case 'apartment':
        return '#28A745';
      case 'condo':
        return '#FF6B35';
      case 'townhouse':
        return '#6F42C1';
      default:
        return '#6C757D';
    }
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
      
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={handleMyLocation}
      >
        <Icon name="my-location" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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

  const renderMapLegend = () => (
    <View style={styles.legend}>
      <Text style={styles.legendTitle}>Property Types</Text>
      <View style={styles.legendItems}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#006AFF' }]} />
          <Text style={styles.legendText}>House</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#28A745' }]} />
          <Text style={styles.legendText}>Apartment</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
          <Text style={styles.legendText}>Condo</Text>
        </View>
      </View>
    </View>
  );

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
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
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
});

export default MapScreen;
