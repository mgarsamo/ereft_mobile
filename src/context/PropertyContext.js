import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import UserStorage from '../services/UserStorage';
import GeocodingService from '../services/GeocodingService';

const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider = ({ children }) => {
  const { api, isAuthenticated, token, user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({});
  const [propertyStats, setPropertyStats] = useState({
    total_properties: 150,
    for_sale: 89,
    for_rent: 61,
    average_price: 2500000
  });

  // Get property statistics from backend
  const getPropertyStats = async () => {
    try {
      console.log('📊 PropertyContext: Fetching property statistics from backend...');
      
      if (api && isAuthenticated) {
        try {
          const response = await api.get('/api/properties/stats/');
          console.log('📊 PropertyContext: Stats API response status:', response.status);
          console.log('📊 PropertyContext: Stats data:', response.data);
          
          if (response.data) {
            const newStats = {
              total_properties: response.data.total_properties || 0,
              for_sale: response.data.for_sale || 0,
              for_rent: response.data.for_rent || 0,
              average_price: response.data.average_price || 0,
              total_views: response.data.total_views || 0,
              featured_properties: response.data.featured_properties || 0,
            };
            
            console.log('📊 PropertyContext: Setting real stats from backend:', newStats);
            setPropertyStats(newStats);
            return newStats;
          }
        } catch (apiError) {
          console.error('📊 PropertyContext: Stats API failed:', apiError.message);
          
          // Fall back to demo stats
          console.log('📊 PropertyContext: Using demo stats as fallback');
          const demoStats = getDemoPropertyStats();
          setPropertyStats(demoStats);
          return demoStats;
        }
      } else {
        console.log('📊 PropertyContext: Not authenticated, using demo stats');
        // Not authenticated, use demo stats
        const demoStats = getDemoPropertyStats();
        setPropertyStats(demoStats);
        return demoStats;
      }
    } catch (error) {
      console.error('📊 PropertyContext: Error fetching property stats:', error);
      
      // Return demo stats as fallback
      const demoStats = getDemoPropertyStats();
      setPropertyStats(demoStats);
      return demoStats;
    }
  };

  // Demo property statistics
  const getDemoPropertyStats = () => {
    return {
      total_properties: 150,
      for_sale: 89,
      for_rent: 61,
      average_price: 2500000,
      total_views: 12500,
      featured_properties: 12,
    };
  };

  // Initialize properties and featured properties on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🏠 PropertyContext: Initializing property data...');
        
        // Initialize with demo data immediately for fast UI response
        const demoProperties = getDemoProperties();
        const demoFeatured = getDemoFeaturedProperties();
        const demoStats = getDemoPropertyStats();
        
        setProperties(demoProperties);
        setFeaturedProperties(demoFeatured);
        setPropertyStats(demoStats);
        
        // Then try to fetch real data if authenticated
        if (isAuthenticated) {
          console.log('🏠 PropertyContext: User authenticated, fetching real data...');
          await Promise.all([
            getProperties(),
            getFeaturedProperties(),
            getPropertyStats(),
            getFavorites(),
          ]);
        } else {
          console.log('🏠 PropertyContext: User not authenticated, using demo data');
        }
      } catch (error) {
        console.error('🏠 PropertyContext: Error initializing property data:', error);
        // Keep demo data if initialization fails
      }
    };
    
    initializeData();
  }, [isAuthenticated]);

  // Helper function to safely get properties array
  const getSafeProperties = () => {
    return properties || getDemoProperties();
  };

  // Helper function to safely get featured properties array
  const getSafeFeaturedProperties = () => {
    return featuredProperties || getDemoFeaturedProperties();
  };

  // Demo properties data
  const getDemoProperties = () => {
    return [
      {
        id: 1,
        title: 'Beautiful House in Bole',
        price: 2500000,
        location: 'Bole, Addis Ababa',
        address: 'Bole District, Addis Ababa',
        city: 'Addis Ababa',
        sub_city: 'Bole',
        kebele: '03',
        bedrooms: 4,
        bathrooms: 3,
        area_sqm: 250,
        description: 'Spacious house with modern amenities in prime location.',
        property_type: 'house',
        listing_type: 'sale',
        images: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        ],
        owner: { name: 'John Doe', phone: '+251-911-123456', email: 'john@example.com' },
        is_favorite: false,
        created_at: new Date().toISOString(),
        latitude: 9.0192,
        longitude: 38.7525,
        features: {
          has_garage: true,
          has_pool: false,
          has_garden: true,
          has_balcony: true,
          is_furnished: false,
          has_air_conditioning: true,
          has_heating: false
        }
      },
      {
        id: 2,
        title: 'Modern Apartment in Kazanchis',
        price: 1800000,
        location: 'Kazanchis, Addis Ababa',
        address: 'Kazanchis District, Addis Ababa',
        city: 'Addis Ababa',
        sub_city: 'Arada',
        kebele: '07',
        bedrooms: 3,
        bathrooms: 2,
        area_sqm: 180,
        description: 'Modern apartment with city view and contemporary finishes.',
        property_type: 'apartment',
        listing_type: 'sale',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800',
        ],
        owner: { name: 'Jane Smith', phone: '+251-911-654321', email: 'jane@example.com' },
        is_favorite: false,
        created_at: new Date().toISOString(),
        latitude: 9.0300,
        longitude: 38.7400,
        features: {
          has_garage: false,
          has_pool: false,
          has_garden: false,
          has_balcony: true,
          is_furnished: true,
          has_air_conditioning: true,
          has_heating: false
        }
      },
      {
        id: 3,
        title: 'Commercial Space in Merkato',
        price: 3500000,
        location: 'Merkato, Addis Ababa',
        address: 'Merkato District, Addis Ababa',
        city: 'Addis Ababa',
        sub_city: 'Addis Ketema',
        kebele: '02',
        bedrooms: 0,
        bathrooms: 2,
        area_sqm: 300,
        description: 'Prime commercial space in busy market area with high foot traffic.',
        property_type: 'commercial',
        listing_type: 'rent',
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
        ],
        owner: { name: 'Business Owner', phone: '+251-911-789123', email: 'business@example.com' },
        is_favorite: false,
        created_at: new Date().toISOString(),
        latitude: 9.0100,
        longitude: 38.7200,
        features: {
          has_garage: true,
          has_pool: false,
          has_garden: false,
          has_balcony: false,
          is_furnished: false,
          has_air_conditioning: true,
          has_heating: false
        }
      }
    ];
  };

  // Demo featured properties data
  const getDemoFeaturedProperties = () => {
    return [
      {
        id: 101,
        title: 'Luxury Villa in Bole',
        price: 5500000,
        location: 'Bole, Addis Ababa',
        address: 'Bole Atlas, Addis Ababa',
        city: 'Addis Ababa',
        sub_city: 'Bole',
        kebele: '01',
        bedrooms: 5,
        bathrooms: 4,
        area_sqm: 400,
        description: 'Stunning luxury villa with pool and garden.',
        property_type: 'house',
        listing_type: 'sale',
        is_featured: true,
        images: [],
        owner: { name: 'Luxury Properties', phone: '+251-911-555000', email: 'luxury@example.com' },
        is_favorite: false,
        created_at: new Date().toISOString(),
        latitude: 9.0250,
        longitude: 38.7600,
        features: {
          has_garage: true,
          has_pool: true,
          has_garden: true,
          has_balcony: true,
          is_furnished: true,
          has_air_conditioning: true,
          has_heating: false
        }
      },
      {
        id: 102,
        title: 'Penthouse in CMC',
        price: 4200000,
        location: 'CMC, Addis Ababa',
        address: 'CMC Area, Addis Ababa',
        city: 'Addis Ababa',
        sub_city: 'Bole',
        kebele: '05',
        bedrooms: 4,
        bathrooms: 3,
        area_sqm: 320,
        description: 'Modern penthouse with panoramic city views.',
        property_type: 'apartment',
        listing_type: 'sale',
        is_featured: true,
        images: [],
        owner: { name: 'Premium Homes', phone: '+251-911-555001', email: 'premium@example.com' },
        is_favorite: false,
        created_at: new Date().toISOString(),
        latitude: 9.0180,
        longitude: 38.7580,
        features: {
          has_garage: true,
          has_pool: false,
          has_garden: false,
          has_balcony: true,
          is_furnished: true,
          has_air_conditioning: true,
          has_heating: false
        }
      }
    ];
  };

  // Get properties with proper backend integration
  const getProperties = async (page = 1, filters = {}) => {
    try {
      setIsLoading(true);
      console.log('🏠 PropertyContext: Fetching properties from backend...');
      
      // Try to fetch from API first
      if (api && isAuthenticated) {
        try {
          const params = { page, ...filters };
          console.log('🏠 PropertyContext: API call params:', params);
          
          const response = await api.get('/api/properties/', { params });
          console.log('🏠 PropertyContext: API response status:', response.status);
          console.log('🏠 PropertyContext: API response data length:', response.data?.results?.length || response.data?.length || 0);
          
          if (response.data && (response.data.results || response.data.length > 0)) {
            const realProperties = response.data.results || response.data;
            console.log('🏠 PropertyContext: Setting real properties from backend:', realProperties.length);
            setProperties(realProperties);
            return { results: realProperties, count: realProperties.length };
          } else {
            console.log('🏠 PropertyContext: No properties returned from API, using demo data');
            const demoProperties = getDemoProperties();
            setProperties(demoProperties);
            return { results: demoProperties, count: demoProperties.length };
          }
        } catch (apiError) {
          console.error('🏠 PropertyContext: API fetch failed:', apiError.message);
          console.error('🏠 PropertyContext: API error details:', apiError.response?.data);
          
          // If it's an authentication error, clear the token
          if (apiError.response?.status === 401) {
            console.log('🏠 PropertyContext: Authentication error, clearing token');
            // You might want to trigger a logout here
          }
          
          // Fall back to demo data
          const demoProperties = getDemoProperties();
          setProperties(demoProperties);
          return { results: demoProperties, count: demoProperties.length };
        }
      } else {
        console.log('🏠 PropertyContext: Not authenticated or no API, using demo data');
        // Not authenticated, use demo data
        const demoProperties = getDemoProperties();
        setProperties(demoProperties);
        return { results: demoProperties, count: demoProperties.length };
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error in getProperties:', error);
      
      // Return demo properties if everything fails
      const fallbackProperties = getDemoProperties();
      setProperties(fallbackProperties);
      return { results: fallbackProperties, count: fallbackProperties.length };
    } finally {
      setIsLoading(false);
    }
  };

  // Get featured properties with proper backend integration
  const getFeaturedProperties = async () => {
    try {
      console.log('🏠 PropertyContext: Fetching featured properties from backend...');
      
      // Try API first if authenticated
      if (api && isAuthenticated) {
        try {
          const response = await api.get('/api/properties/featured/');
          console.log('🏠 PropertyContext: Featured API response status:', response.status);
          console.log('🏠 PropertyContext: Featured API response data length:', response.data?.length || 0);
          
          if (response.data && response.data.length > 0) {
            console.log('🏠 PropertyContext: Setting real featured properties from backend:', response.data.length);
            setFeaturedProperties(response.data);
            return response.data;
          } else {
            console.log('🏠 PropertyContext: No featured properties returned from API, using demo data');
            const demoFeatured = getDemoFeaturedProperties();
            setFeaturedProperties(demoFeatured);
            return demoFeatured;
          }
        } catch (apiError) {
          console.error('🏠 PropertyContext: Featured API fetch failed:', apiError.message);
          console.error('🏠 PropertyContext: Featured API error details:', apiError.response?.data);
          
          // Fall back to demo data
          const demoFeatured = getDemoFeaturedProperties();
          setFeaturedProperties(demoFeatured);
          return demoFeatured;
        }
      } else {
        console.log('🏠 PropertyContext: Not authenticated, using demo featured properties');
        // Not authenticated, use demo data
        const demoFeatured = getDemoFeaturedProperties();
        setFeaturedProperties(demoFeatured);
        return demoFeatured;
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error fetching featured properties:', error);
      
      // Return demo featured properties if everything fails
      const fallbackFeatured = getDemoFeaturedProperties();
      setFeaturedProperties(fallbackFeatured);
      return fallbackFeatured;
    }
  };

  // Get property details
  const getPropertyDetails = async (propertyId) => {
    try {
      // Try API first if authenticated and have backend token
      if (api && isAuthenticated && token && !token.startsWith('ereft_token_')) {
        try {
          const response = await api.get(`/api/properties/${propertyId}/`);
          if (response.data) {
            return response.data;
          }
        } catch (apiError) {
          console.error('API property details failed:', apiError.message);
          // Fall back to demo data
        }
      }
      
      // Fall back to demo property data
      const demoProperties = getDemoProperties();
      const demoProperty = demoProperties.find(p => p.id == propertyId) || demoProperties[0];
      
      if (demoProperty) {
        return demoProperty;
      }
      
      // Return a default property if nothing found
      return {
        id: propertyId,
        title: 'Property Details',
        price: 0,
        location: 'Location not specified',
        description: 'Property details not available',
        bedrooms: 0,
        bathrooms: 0,
        area_sqm: 0,
        property_type: 'house',
        listing_type: 'sale',
        images: [],
        owner: { name: 'Owner', phone: '+251-911-123456', email: 'owner@example.com' },
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching property details:', error);
      // Return default property data instead of throwing
      return {
        id: propertyId,
        title: 'Property Details',
        price: 0,
        location: 'Location not specified',
        description: 'Property details not available',
        bedrooms: 0,
        bathrooms: 0,
        area_sqm: 0,
        property_type: 'house',
        listing_type: 'sale',
        images: [],
        owner: { name: 'Owner', phone: '+251-911-123456', email: 'owner@example.com' },
        created_at: new Date().toISOString(),
      };
    }
  };

  // Search properties with proper backend integration
  const searchProperties = async (query, filters = {}) => {
    try {
      setIsLoading(true);
      console.log('🔍 PropertyContext: Searching properties with query:', query, 'filters:', filters);
      
      // Try API first if authenticated
      if (api && isAuthenticated) {
        try {
          const params = { 
            search: query || '',
            page: 1,
            ...filters 
          };
          console.log('🔍 PropertyContext: API search params:', params);
          
          const response = await api.get('/api/properties/search/', { params });
          console.log('🔍 PropertyContext: Search API response status:', response.status);
          console.log('🔍 PropertyContext: Search results count:', response.data?.results?.length || response.data?.length || 0);
          
          if (response.data && (response.data.results || response.data.length > 0)) {
            const searchResults = response.data.results || response.data;
            console.log('🔍 PropertyContext: Setting search results from backend:', searchResults.length);
            setSearchResults(searchResults);
            setSearchFilters({ query, ...filters });
            return { results: searchResults, count: searchResults.length };
          } else {
            console.log('🔍 PropertyContext: No search results from API, using demo data');
            // No results from API, use demo data
            const demoProperties = getDemoProperties();
            const filteredDemo = filterDemoProperties(demoProperties, query, filters);
            setSearchResults(filteredDemo);
            setSearchFilters({ query, ...filters });
            return { results: filteredDemo, count: filteredDemo.length };
          }
        } catch (apiError) {
          console.error('🔍 PropertyContext: Search API failed:', apiError.message);
          console.error('🔍 PropertyContext: Search API error details:', apiError.response?.data);
          
          // Fall back to demo data with filtering
          console.log('🔍 PropertyContext: Falling back to demo search');
          const demoProperties = getDemoProperties();
          const filteredDemo = filterDemoProperties(demoProperties, query, filters);
          setSearchResults(filteredDemo);
          setSearchFilters({ query, ...filters });
          return { results: filteredDemo, count: filteredDemo.length };
        }
      } else {
        // Not authenticated, use demo data with filtering
        console.log('🔍 PropertyContext: Not authenticated, using demo search');
        const demoProperties = getDemoProperties();
        const filteredDemo = filterDemoProperties(demoProperties, query, filters);
        setSearchResults(filteredDemo);
        setSearchFilters({ query, ...filters });
        return { results: filteredDemo, count: filteredDemo.length };
      }
    } catch (error) {
      console.error('🔍 PropertyContext: Error searching properties:', error);
      
      // Return demo data as fallback
      const fallbackResults = getDemoProperties().slice(0, 5);
      setSearchResults(fallbackResults);
      return { results: fallbackResults, count: fallbackResults.length };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to filter demo properties
  const filterDemoProperties = (properties, query, filters) => {
    let filtered = properties;
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm) ||
        property.address.toLowerCase().includes(searchTerm) ||
        property.city.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(property => 
        property.property_type === filters.propertyType.toLowerCase()
      );
    }
    
    // Listing type filter
    if (filters.listingType) {
      filtered = filtered.filter(property => 
        property.listing_type === filters.listingType.toLowerCase()
      );
    }
    
    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(property => {
        const price = property.price;
        if (filters.minPrice && price < filters.minPrice) return false;
        if (filters.maxPrice && price > filters.maxPrice) return false;
        return true;
      });
    }
    
    // Bedrooms filter
    if (filters.bedrooms) {
      filtered = filtered.filter(property => 
        property.bedrooms >= filters.bedrooms
      );
    }
    
    // Bathrooms filter
    if (filters.bathrooms) {
      filtered = filtered.filter(property => 
        property.bathrooms >= filters.bathrooms
      );
    }
    
    // Area filter
    if (filters.minArea || filters.maxArea) {
      filtered = filtered.filter(property => {
        const area = property.area_sqm;
        if (filters.minArea && area < filters.minArea) return false;
        if (filters.maxArea && area > filters.maxArea) return false;
        return true;
      });
    }
    
    // Location filter
    if (filters.city) {
      filtered = filtered.filter(property => 
        property.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get user favorites with proper backend integration
  const getFavorites = async () => {
    try {
      console.log('❤️ PropertyContext: Fetching user favorites from backend...');
      
      if (api && isAuthenticated && user?.id) {
        try {
          const response = await api.get('/api/favorites/');
          console.log('❤️ PropertyContext: Favorites API response status:', response.status);
          console.log('❤️ PropertyContext: Favorites count:', response.data?.results?.length || response.data?.length || 0);
          
          if (response.data && (response.data.results || response.data.length > 0)) {
            const favorites = response.data.results || response.data;
            console.log('❤️ PropertyContext: Setting favorites from backend:', favorites.length);
            setFavorites(favorites);
            return favorites;
          } else {
            console.log('❤️ PropertyContext: No favorites from API');
            setFavorites([]);
            return [];
          }
        } catch (apiError) {
          console.error('❤️ PropertyContext: Favorites API failed:', apiError.message);
          
          // Fall back to demo favorites if API fails
          console.log('❤️ PropertyContext: Using demo favorites as fallback');
          const demoFavorites = getDemoFavorites();
          setFavorites(demoFavorites);
          return demoFavorites;
        }
      } else {
        console.log('❤️ PropertyContext: Not authenticated, using demo favorites');
        // Not authenticated, use demo favorites
        const demoFavorites = getDemoFavorites();
        setFavorites(demoFavorites);
        return demoFavorites;
      }
    } catch (error) {
      console.error('❤️ PropertyContext: Error fetching favorites:', error);
      
      // Return demo favorites as fallback
      const demoFavorites = getDemoFavorites();
      setFavorites(demoFavorites);
      return demoFavorites;
    }
  };

  // Demo favorites data
  const getDemoFavorites = () => {
    return [
      {
        id: '1',
        property: {
          id: 1,
          title: 'Beautiful House in Bole',
          price: 2500000,
          location: 'Bole, Addis Ababa',
          address: 'Bole District, Addis Ababa',
          city: 'Addis Ababa',
          bedrooms: 4,
          bathrooms: 3,
          area_sqm: 250,
          property_type: 'house',
          listing_type: 'sale',
          images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
        },
        created_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        property: {
          id: 2,
          title: 'Modern Apartment in Kazanchis',
          price: 1800000,
          location: 'Kazanchis, Addis Ababa',
          address: 'Kazanchis District, Addis Ababa',
          city: 'Addis Ababa',
          bedrooms: 3,
          bathrooms: 2,
          area_sqm: 120,
          property_type: 'apartment',
          listing_type: 'sale',
          images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
        },
        created_at: '2024-01-10T00:00:00Z',
      }
    ];
  };

  // Toggle favorite with proper backend integration
  const toggleFavorite = async (propertyId) => {
    try {
      console.log('❤️ PropertyContext: Toggling favorite for property:', propertyId);
      
      if (api && isAuthenticated && user?.id) {
        try {
          // Check if property is already favorited
          const isFavorited = favorites.some(fav => fav.property.id === propertyId);
          
          if (isFavorited) {
            // Remove from favorites
            console.log('❤️ PropertyContext: Removing property from favorites');
            const response = await api.delete(`/api/favorites/${propertyId}/`);
            console.log('❤️ PropertyContext: Remove favorite response:', response.status);
            
            // Update local state
            setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
            
            // Update property is_favorite status
            setProperties(prev => 
              prev.map(p => p.id === propertyId ? { ...p, is_favorite: false } : p)
            );
            
            return { success: true, isFavorited: false };
          } else {
            // Add to favorites
            console.log('❤️ PropertyContext: Adding property to favorites');
            const response = await api.post('/api/favorites/', { property: propertyId });
            console.log('❤️ PropertyContext: Add favorite response:', response.status);
            
            // Get the property details
            const property = properties.find(p => p.id === propertyId);
            if (property) {
              const newFavorite = {
                id: response.data.id || `fav_${Date.now()}`,
                property: property,
                created_at: new Date().toISOString(),
              };
              
              // Update local state
              setFavorites(prev => [newFavorite, ...prev]);
              
              // Update property is_favorite status
              setProperties(prev => 
                prev.map(p => p.id === propertyId ? { ...p, is_favorite: true } : p)
              );
            }
            
            return { success: true, isFavorited: true };
          }
        } catch (apiError) {
          console.error('❤️ PropertyContext: Favorites API failed:', apiError.message);
          
          // Fall back to local handling
          console.log('❤️ PropertyContext: Falling back to local favorite toggle');
          return toggleFavoriteLocal(propertyId);
        }
      } else {
        // Not authenticated, use local handling
        console.log('❤️ PropertyContext: Not authenticated, using local favorite toggle');
        return toggleFavoriteLocal(propertyId);
      }
    } catch (error) {
      console.error('❤️ PropertyContext: Error toggling favorite:', error);
      throw error;
    }
  };

  // Local favorite toggle for demo mode
  const toggleFavoriteLocal = (propertyId) => {
    try {
      const isFavorited = favorites.some(fav => fav.property.id === propertyId);
      
      if (isFavorited) {
        // Remove from favorites
        setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
        setProperties(prev => 
          prev.map(p => p.id === propertyId ? { ...p, is_favorite: false } : p)
        );
        return { success: true, isFavorited: false };
      } else {
        // Add to favorites
        const property = properties.find(p => p.id === propertyId);
        if (property) {
          const newFavorite = {
            id: `local_fav_${Date.now()}`,
            property: property,
            created_at: new Date().toISOString(),
          };
          
          setFavorites(prev => [newFavorite, ...prev]);
          setProperties(prev => 
            prev.map(p => p.id === propertyId ? { ...p, is_favorite: true } : p)
          );
        }
        
        return { success: true, isFavorited: true };
      }
    } catch (error) {
      console.error('❤️ PropertyContext: Error in local favorite toggle:', error);
      throw error;
    }
  };

  // Add new property with proper backend integration and map coordinates
  const addProperty = async (propertyData) => {
    try {
      setIsLoading(true);
      console.log('🏠 PropertyContext: Adding new property to backend...');
      console.log('🏠 PropertyContext: Property data:', propertyData);
      
      // Automatically geocode the address to get coordinates for map
      let coordinates = null;
      if (propertyData.address && !propertyData.latitude && !propertyData.longitude) {
        try {
          console.log('🗺️ PropertyContext: Geocoding address for map integration...');
          coordinates = await GeocodingService.geocodeAddress(
            propertyData.address, 
            propertyData.city || 'Addis Ababa, Ethiopia'
          );
          
          console.log('🗺️ PropertyContext: Address geocoded successfully:', coordinates);
          
          // Add coordinates to property data
          propertyData.latitude = coordinates.latitude;
          propertyData.longitude = coordinates.longitude;
          propertyData.formatted_address = coordinates.formatted_address;
          propertyData.place_id = coordinates.place_id;
          
          if (coordinates.is_fallback) {
            console.log('🗺️ PropertyContext: Using fallback coordinates - user should verify location');
          }
        } catch (geocodeError) {
          console.error('🗺️ PropertyContext: Geocoding failed, using fallback coordinates:', geocodeError);
          
          // Use fallback coordinates
          const fallbackCoords = GeocodingService.getFallbackCoordinates(
            propertyData.address, 
            propertyData.city || 'Addis Ababa'
          );
          
          propertyData.latitude = fallbackCoords.latitude;
          propertyData.longitude = fallbackCoords.longitude;
          propertyData.formatted_address = fallbackCoords.formatted_address;
          propertyData.is_fallback_coordinates = true;
        }
      }
      
      // Try API first if authenticated
      if (api && isAuthenticated) {
        try {
          const formData = new FormData();
          
          // Add basic property data
          Object.keys(propertyData).forEach(key => {
            if (key === 'images' && Array.isArray(propertyData[key])) {
              propertyData[key].forEach((image, index) => {
                if (image && image.uri) {
                  formData.append('images', {
                    uri: image.uri,
                    type: image.type || 'image/jpeg',
                    name: `image_${index}.jpg`,
                  });
                }
              });
            } else if (propertyData[key] !== undefined && propertyData[key] !== '') {
              formData.append(key, propertyData[key]);
            }
          });
          
          console.log('🏠 PropertyContext: FormData prepared, sending to backend...');
          
          const response = await api.post('/api/properties/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          console.log('🏠 PropertyContext: Backend response:', response.status);
          console.log('🏠 PropertyContext: Created property:', response.data);
          
          // Add to properties list
          setProperties(prev => [response.data, ...(prev || [])]);
          
          // Update featured properties if this is a featured property
          if (response.data.is_featured) {
            setFeaturedProperties(prev => [response.data, ...(prev || [])]);
          }
          
          return response.data;
        } catch (apiError) {
          console.error('🏠 PropertyContext: API property creation failed:', apiError.message);
          console.error('🏠 PropertyContext: API error details:', apiError.response?.data);
          
          // If it's a validation error, show the specific error
          if (apiError.response?.status === 400) {
            const errorMessage = apiError.response.data?.error || apiError.response.data?.message || 'Validation error';
            throw new Error(errorMessage);
          }
          
          // If it's an authentication error
          if (apiError.response?.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          
          // For other errors, fall back to local handling
          console.log('🏠 PropertyContext: Falling back to local property creation');
        }
      }
      
      // Local fallback for demo mode or when API fails
      console.log('🏠 PropertyContext: Creating property locally...');
      const newProperty = {
        ...propertyData,
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        owner: user || { name: 'Local User', id: 'local_user' },
        is_favorited: false,
        is_featured: false,
        // Ensure coordinates are included for map integration
        latitude: propertyData.latitude || coordinates?.latitude || 9.0192,
        longitude: propertyData.longitude || coordinates?.longitude || 38.7525,
        formatted_address: propertyData.formatted_address || coordinates?.formatted_address || propertyData.address,
      };
      
      setProperties(prev => [newProperty, ...(prev || [])]);
      
      // Update user stats locally
      if (user && user.id) {
        try {
          await UserStorage.updateUserStats(user.id, {
            total_listings: 1,
            active_listings: 1
          });
        } catch (error) {
          console.error('🏠 PropertyContext: Error updating user stats:', error);
        }
      }
      
      console.log('🏠 PropertyContext: Property created locally with map coordinates:', newProperty);
      return newProperty;
    } catch (error) {
      console.error('🏠 PropertyContext: Error adding property:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update property
  const updateProperty = async (propertyId, propertyData) => {
    try {
      // Try API first if authenticated and have backend token
      if (api && isAuthenticated && token && !token.startsWith('ereft_token_')) {
        try {
          const response = await api.put(`/api/properties/${propertyId}/`, propertyData);
          if (response.data) {
            // Update local state
            setProperties(prev => 
              prev.map(p => p.id === propertyId ? response.data : p)
            );
            return response.data;
          }
        } catch (apiError) {
          console.error('API update failed:', apiError.message);
          // Fall back to local update
        }
      }
      
      // Local update for demo mode
      const updatedProperty = { ...propertyData, id: propertyId };
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? updatedProperty : p)
      );
      return updatedProperty;
    } catch (error) {
      console.error('Error updating property:', error);
      // Return the property data instead of throwing
      return { ...propertyData, id: propertyId };
    }
  };

  // Get user's own properties
  const getUserProperties = async () => {
    try {
      console.log('🏠 PropertyContext: Fetching user properties from backend...');
      
      if (api && isAuthenticated && user?.id) {
        try {
          const response = await api.get(`/api/properties/user/${user.id}/`);
          console.log('🏠 PropertyContext: User properties API response:', response.status);
          console.log('🏠 PropertyContext: User properties count:', response.data?.length || 0);
          
          if (response.data && response.data.length > 0) {
            return response.data;
          } else {
            console.log('🏠 PropertyContext: No user properties found');
            return [];
          }
        } catch (apiError) {
          console.error('🏠 PropertyContext: User properties API failed:', apiError.message);
          
          // Fall back to filtering local properties
          const userProperties = properties.filter(p => p.owner?.id === user.id);
          console.log('🏠 PropertyContext: Using local user properties:', userProperties.length);
          return userProperties;
        }
      } else {
        console.log('🏠 PropertyContext: Not authenticated or no user ID');
        return [];
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error getting user properties:', error);
      return [];
    }
  };

  // Delete property
  const deleteProperty = async (propertyId) => {
    try {
      console.log('🏠 PropertyContext: Deleting property:', propertyId);
      
      if (api && isAuthenticated) {
        try {
          const response = await api.delete(`/api/properties/${propertyId}/`);
          console.log('🏠 PropertyContext: Property deleted from backend:', response.status);
          
          // Remove from local state
          setProperties(prev => prev.filter(p => p.id !== propertyId));
          setFeaturedProperties(prev => prev.filter(p => p.id !== propertyId));
          
          return { success: true, message: 'Property deleted successfully' };
        } catch (apiError) {
          console.error('🏠 PropertyContext: API delete failed:', apiError.message);
          
          if (apiError.response?.status === 403) {
            throw new Error('You do not have permission to delete this property');
          }
          
          if (apiError.response?.status === 404) {
            throw new Error('Property not found');
          }
          
          throw new Error('Failed to delete property from backend');
        }
      } else {
        // Local deletion for demo mode
        console.log('🏠 PropertyContext: Deleting property locally');
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        setFeaturedProperties(prev => prev.filter(p => p.id !== propertyId));
        
        return { success: true, message: 'Property deleted locally' };
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error deleting property:', error);
      throw error;
    }
  };

  // Contact agent
  const contactAgent = async (propertyId, contactData) => {
    try {
      // Try API first if authenticated and have backend token
      if (api && isAuthenticated && token && !token.startsWith('ereft_token_')) {
        try {
          const response = await api.post(`/api/properties/${propertyId}/contact/`, contactData);
          if (response.data) {
            return response.data;
          }
        } catch (apiError) {
          console.error('API contact failed:', apiError.message);
          // Fall back to local handling
        }
      }
      
      // Return success response for demo mode
      return { 
        success: true, 
        message: 'Contact request sent successfully (demo mode)',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error contacting agent:', error);
      // Return success response instead of throwing
      return { 
        success: true, 
        message: 'Contact request sent successfully (demo mode)',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Track property view
  const trackPropertyView = async (propertyId) => {
    try {
      // Try API first if authenticated and have backend token
      if (api && isAuthenticated && token && !token.startsWith('ereft_token_')) {
        try {
          await api.post(`/api/properties/${propertyId}/track-view/`);
          return true;
        } catch (apiError) {
          console.error('API track view failed:', apiError.message);
          // Fall back to local tracking
        }
      }
      
      // Local tracking for demo mode
      console.log(`Property view tracked locally: ${propertyId}`);
      
      // Update user stats locally if this is the property owner
      if (user && user.id && properties) {
        const property = properties.find(p => p.id === propertyId);
        if (property && property.owner && property.owner.id === user.id) {
          try {
            await UserStorage.updateUserStats(user.id, {
              views_total: 1,
              recent_views: 1
            });
          } catch (error) {
            console.error('Error updating user stats:', error);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking property view:', error);
      // Return success instead of throwing
      return true;
    }
  };

  // Get search history
  const getSearchHistory = async () => {
    try {
      // Try API first if authenticated and have backend token
      if (api && isAuthenticated && token && !token.startsWith('ereft_token_')) {
        try {
          const response = await api.get('/api/search-history/');
          if (response.data) {
            return response.data;
          }
        } catch (apiError) {
          console.error('API search history failed:', apiError.message);
          // Fall back to empty history
        }
      }
      
      // Return empty search history as fallback
      return [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      // Return empty array instead of throwing
      return [];
    }
  };

  // Clear search results
  const clearSearchResults = () => {
    setSearchResults([]);
    setSearchFilters({});
  };

  // Load initial data - DISABLED TO PREVENT 404 ERRORS
  // useEffect(() => {
  //   getFeaturedProperties();
  //   getPropertyStats();
  // }, []);

  const value = {
    properties: getSafeProperties(),
    featuredProperties: getSafeFeaturedProperties(),
    favorites,
    searchResults,
    isLoading,
    searchFilters,
    propertyStats,
    getProperties,
    getFeaturedProperties,
    getPropertyDetails,
    searchProperties,
    addProperty,
    updateProperty,
    deleteProperty,
    getUserProperties,
    toggleFavorite,
    getFavorites,
    getPropertyStats,
    clearSearchResults,
    setSearchFilters,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};
