/**
 * Geocoding Service for converting addresses to coordinates
 * This service handles address geocoding with Google Maps API and fallback options
 */
class GeocodingService {
  constructor() {
    // Google Maps API Key for geocoding
    this.apiKey = 'AIzaSyA4-mia5UmIz5P3Nfq4pc9sbx19oco1uIg';
    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  }

  /**
   * Convert address to coordinates (latitude, longitude)
   * @param {string} address - The address to geocode
   * @param {string} city - The city (optional, helps with accuracy)
   * @returns {Promise<Object>} Object with latitude, longitude, and formatted_address
   */
  async geocodeAddress(address, city = 'Addis Ababa, Ethiopia') {
    try {
      console.log('🗺️ GeocodingService: Geocoding address:', address);
      
      // Construct full address with city for better accuracy
      const fullAddress = city ? `${address}, ${city}` : address;
      console.log('🗺️ GeocodingService: Full address:', fullAddress);
      
      // Use Google Maps Geocoding API
      const url = `${this.baseUrl}?address=${encodeURIComponent(fullAddress)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('🗺️ GeocodingService: API response status:', data.status);
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        const coordinates = {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
        };
        
        console.log('🗺️ GeocodingService: Geocoding successful:', coordinates);
        return coordinates;
      } else {
        console.error('🗺️ GeocodingService: Geocoding failed:', data.status, data.error_message);
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      console.error('🗺️ GeocodingService: Error during geocoding:', error);
      
      // Fallback to approximate coordinates based on city/district
      const fallbackCoordinates = this.getFallbackCoordinates(address, city);
      console.log('🗺️ GeocodingService: Using fallback coordinates:', fallbackCoordinates);
      
      return fallbackCoordinates;
    }
  }

  /**
   * Get fallback coordinates for common Ethiopian cities/districts
   * @param {string} address - The address
   * @param {string} city - The city
   * @returns {Object} Fallback coordinates
   */
  getFallbackCoordinates(address, city) {
    // Common coordinates for Ethiopian cities and districts
    const cityCoordinates = {
      'Addis Ababa': { latitude: 9.0192, longitude: 38.7525 },
      'Bole': { latitude: 9.0192, longitude: 38.7525 },
      'Kazanchis': { latitude: 9.0272, longitude: 38.7469 },
      'Piassa': { latitude: 9.0329, longitude: 38.7489 },
      'CMC': { latitude: 9.0122, longitude: 38.7619 },
      'Kolfe': { latitude: 9.0089, longitude: 38.7389 },
      'Yeka': { latitude: 9.0156, longitude: 38.7656 },
      'Lideta': { latitude: 9.0256, longitude: 38.7456 },
      'Arada': { latitude: 9.0356, longitude: 38.7556 },
      'Kirkos': { latitude: 9.0456, longitude: 38.7356 },
      'Nifas Silk': { latitude: 9.0556, longitude: 38.7256 },
      'Akaki Kality': { latitude: 8.9856, longitude: 38.7756 },
      'Bole Bulbula': { latitude: 9.0092, longitude: 38.7625 },
      'Summit': { latitude: 9.0292, longitude: 38.7425 },
      'Gerji': { latitude: 9.0392, longitude: 38.7325 },
      'Old Airport': { latitude: 9.0492, longitude: 38.7225 },
      'Meskel Square': { latitude: 9.0192, longitude: 38.7525 },
      'Entoto': { latitude: 9.0092, longitude: 38.7625 },
      'Shiro Meda': { latitude: 9.0292, longitude: 38.7425 },
      'Piazza': { latitude: 9.0329, longitude: 38.7489 },
    };

    // Try to find exact city match
    for (const [cityName, coords] of Object.entries(cityCoordinates)) {
      if (city.toLowerCase().includes(cityName.toLowerCase()) || 
          address.toLowerCase().includes(cityName.toLowerCase())) {
        return {
          latitude: coords.latitude + (Math.random() - 0.5) * 0.01, // Add small random offset
          longitude: coords.longitude + (Math.random() - 0.5) * 0.01,
          formatted_address: `${address}, ${city}`,
          place_id: null,
          is_fallback: true,
        };
      }
    }

    // Default to Addis Ababa center with random offset
    return {
      latitude: 9.0192 + (Math.random() - 0.5) * 0.02,
      longitude: 38.7525 + (Math.random() - 0.5) * 0.02,
      formatted_address: `${address}, ${city}`,
      place_id: null,
      is_fallback: true,
    };
  }

  /**
   * Reverse geocoding: Convert coordinates to address
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<string>} Formatted address
   */
  async reverseGeocode(latitude, longitude) {
    try {
      console.log('🗺️ GeocodingService: Reverse geocoding coordinates:', { latitude, longitude });
      
      const url = `${this.baseUrl}?latlng=${latitude},${longitude}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        console.log('🗺️ GeocodingService: Reverse geocoding successful:', address);
        return address;
      } else {
        console.error('🗺️ GeocodingService: Reverse geocoding failed:', data.status);
        return 'Address not found';
      }
    } catch (error) {
      console.error('🗺️ GeocodingService: Error during reverse geocoding:', error);
      return 'Address not found';
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

export default new GeocodingService();
