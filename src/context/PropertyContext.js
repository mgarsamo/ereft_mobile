import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import UserStorage from '../services/UserStorage';
import GeocodingService from '../services/GeocodingService';
import { ENV } from '../config/env';

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
          const response = await api.get('/api/properties/');
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

  // Upload images to Cloudinary
  const uploadImagesToCloudinary = async (images) => {
    try {
      console.log('🏠 PropertyContext: Starting Cloudinary upload for', images.length, 'images');
      
      const uploadPromises = images.map(async (imageUri, index) => {
        try {
          console.log(`🏠 PropertyContext: Uploading image ${index + 1}/${images.length}`);
          
          // Create form data for Cloudinary upload
          const formData = new FormData();
          formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `property_image_${Date.now()}_${index}.jpg`
          });
          formData.append('upload_preset', ENV.CLOUDINARY_UPLOAD_PRESET);
          formData.append('cloud_name', ENV.CLOUDINARY_CLOUD_NAME);
          
          // Upload to Cloudinary
          const response = await fetch(ENV.CLOUDINARY_API_URL, {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Cloudinary upload failed: ${response.status}`);
          }
          
          const result = await response.json();
          console.log(`🏠 PropertyContext: Image ${index + 1} uploaded successfully:`, result.secure_url);
          
          return {
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height
          };
        } catch (error) {
          console.error(`🏠 PropertyContext: Failed to upload image ${index + 1}:`, error);
          throw error;
        }
      });
      
      const uploadedImages = await Promise.all(uploadPromises);
      console.log('🏠 PropertyContext: All images uploaded successfully:', uploadedImages.length);
      
      return uploadedImages;
    } catch (error) {
      console.error('🏠 PropertyContext: Error in Cloudinary upload:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
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
          console.log('🏠 PropertyContext: API response data length:', response.data?.length || 0);
          
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

  // Get featured properties from backend
  const getFeaturedProperties = async () => {
    try {
      console.log('🏠 PropertyContext: Fetching featured properties from backend...');
      
      if (api && isAuthenticated) {
        try {
          const response = await api.get('/api/properties/');
          console.log('🏠 PropertyContext: Featured API response status:', response.status);
          console.log('🏠 PropertyContext: Featured properties count:', response.data?.length || 0);
          
          if (response.data && response.data.length > 0) {
            console.log('🏠 PropertyContext: Setting featured properties from backend:', response.data.length);
            setFeaturedProperties(response.data);
            return response.data;
          } else {
            console.log('🏠 PropertyContext: No featured properties from API');
            setFeaturedProperties([]);
            return [];
          }
        } catch (apiError) {
          console.error('🏠 PropertyContext: Featured API fetch failed:', apiError.message);
          console.error('🏠 PropertyContext: Featured API error details:', apiError.response?.data);
          
          // Fall back to demo featured properties
          console.log('🏠 PropertyContext: Using demo featured properties as fallback');
          const demoFeatured = getDemoFeaturedProperties();
          setFeaturedProperties(demoFeatured);
          return demoFeatured;
        }
      } else {
        console.log('🏠 PropertyContext: Not authenticated, using demo featured properties');
        // Not authenticated, use demo featured properties
        const demoFeatured = getDemoFeaturedProperties();
        setFeaturedProperties(demoFeatured);
        return demoFeatured;
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error fetching featured properties:', error);
      
      // Return demo featured properties as fallback
      const demoFeatured = getDemoFeaturedProperties();
      setFeaturedProperties(demoFeatured);
      return demoFeatured;
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
          
          const response = await api.get('/api/properties/', { params });
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
            
            // Remove from local state
            setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
            return false;
          } else {
            // Add to favorites
            console.log('❤️ PropertyContext: Adding property to favorites');
            const response = await api.post('/api/favorites/', {
              property_id: propertyId
            });
            console.log('❤️ PropertyContext: Add favorite response:', response.status);
            
            // Add to local state
            const newFavorite = {
              id: response.data.id || Date.now().toString(),
              property: properties.find(p => p.id === propertyId),
              created_at: response.data.created_at || new Date().toISOString()
            };
            setFavorites(prev => [...prev, newFavorite]);
            return true;
          }
        } catch (apiError) {
          console.error('❤️ PropertyContext: Favorites API failed:', apiError.message);
          // Fall back to local state management
          return toggleFavoriteLocal(propertyId);
        }
      } else {
        // Not authenticated, use local state management
        return toggleFavoriteLocal(propertyId);
      }
    } catch (error) {
      console.error('❤️ PropertyContext: Error toggling favorite:', error);
      return false;
    }
  };

  // Local favorite management (fallback)
  const toggleFavoriteLocal = (propertyId) => {
    const isFavorited = favorites.some(fav => fav.property.id === propertyId);
    
    if (isFavorited) {
      setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
      return false;
    } else {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        const newFavorite = {
          id: Date.now().toString(),
          property: property,
          created_at: new Date().toISOString()
        };
        setFavorites(prev => [...prev, newFavorite]);
        return true;
      }
      return false;
    }
  };

  // Clear search results
  const clearSearchResults = () => {
    setSearchResults([]);
    setSearchFilters({});
  };

  // Add new property
  const addProperty = async (propertyData) => {
    try {
      console.log('🏠 PropertyContext: Adding new property:', propertyData);
      setIsLoading(true);

      if (api && isAuthenticated) {
        try {
          // Handle image uploads to Cloudinary first
          let imageUrls = [];
          if (propertyData.images && propertyData.images.length > 0) {
            console.log('🏠 PropertyContext: Uploading images to Cloudinary...');
            try {
              // Upload images to Cloudinary and get URLs
              imageUrls = await uploadImagesToCloudinary(propertyData.images);
              console.log('🏠 PropertyContext: Images uploaded successfully:', imageUrls);
            } catch (uploadError) {
              console.error('🏠 PropertyContext: Image upload failed:', uploadError);
              throw new Error(`Failed to upload images: ${uploadError.message}`);
            }
          }

          // Prepare property data for backend
          const propertyPayload = {
            title: propertyData.title,
            description: propertyData.description,
            price: parseFloat(propertyData.price),
            property_type: propertyData.propertyType,
            listing_type: propertyData.listingType,
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseFloat(propertyData.bathrooms) || 0,
            area_sqm: parseFloat(propertyData.area_sqm) || 0,
            address: propertyData.address,
            city: propertyData.city,
            sub_city: propertyData.sub_city,
            kebele: propertyData.kebele,
            street_name: propertyData.street_name,
            house_number: propertyData.house_number,
            is_featured: false,
            is_active: true,
            is_published: true,
            status: 'active'
          };

          console.log('🏠 PropertyContext: Sending property payload:', propertyPayload);
          
          const response = await api.post('/api/properties/', propertyPayload);
          console.log('🏠 PropertyContext: Property added successfully:', response.data);

          // Add to local state with uploaded images
          const newProperty = {
            ...response.data,
            images: imageUrls,
            is_favorite: false
          };

          setProperties(prev => [newProperty, ...prev]);
          
          // Update featured properties if this should be featured
          if (newProperty.is_featured) {
            setFeaturedProperties(prev => [newProperty, ...prev]);
          }

          return newProperty;
        } catch (apiError) {
          console.error('🏠 PropertyContext: API add property failed:', apiError.message);
          throw new Error(`Failed to add property: ${apiError.message}`);
        }
      } else {
        // Not authenticated, create local property
        console.log('🏠 PropertyContext: Not authenticated, creating local property');
        const localProperty = {
          id: Date.now().toString(),
          ...propertyData,
          created_at: new Date().toISOString(),
          is_favorite: false,
          owner: user || { name: 'Local User' }
        };

        setProperties(prev => [localProperty, ...prev]);
        return localProperty;
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error adding property:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing property
  const updateProperty = async (propertyId, propertyData) => {
    try {
      console.log('🏠 PropertyContext: Updating property:', propertyId, propertyData);
      setIsLoading(true);

      if (api && isAuthenticated) {
        try {
          // Handle image uploads to Cloudinary first if new images are provided
          let imageUrls = [];
          if (propertyData.images && propertyData.images.length > 0) {
            console.log('🏠 PropertyContext: Uploading new images to Cloudinary for update...');
            try {
              // Upload images to Cloudinary and get URLs
              imageUrls = await uploadImagesToCloudinary(propertyData.images);
              console.log('🏠 PropertyContext: New images uploaded successfully:', imageUrls);
            } catch (uploadError) {
              console.error('🏠 PropertyContext: Image upload failed during update:', uploadError);
              throw new Error(`Failed to upload images: ${uploadError.message}`);
            }
          }

          // Prepare property data for backend
          const propertyPayload = {
            title: propertyData.title,
            description: propertyData.description,
            price: parseFloat(propertyData.price),
            property_type: propertyData.propertyType,
            listing_type: propertyData.listingType,
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseFloat(propertyData.bathrooms) || 0,
            area_sqm: parseFloat(propertyData.area_sqm) || 0,
            address: propertyData.address,
            city: propertyData.city,
            sub_city: propertyData.sub_city,
            kebele: propertyData.kebele,
            street_name: propertyData.street_name,
            house_number: propertyData.house_number
          };

          console.log('🏠 PropertyContext: Sending update payload:', propertyPayload);
          
          const response = await api.patch(`/api/properties/${propertyId}/`, propertyPayload);
          console.log('🏠 PropertyContext: Property updated successfully:', response.data);

          // Update local state
          const updatedProperty = {
            ...response.data,
            images: propertyData.images || []
          };

          setProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p));
          
          // Update featured properties if needed
          setFeaturedProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p));

          return updatedProperty;
        } catch (apiError) {
          console.error('🏠 PropertyContext: API update property failed:', apiError.message);
          throw new Error(`Failed to update property: ${apiError.message}`);
        }
      } else {
        // Not authenticated, update local property
        console.log('🏠 PropertyContext: Not authenticated, updating local property');
        const updatedProperty = {
          ...propertyData,
          id: propertyId,
          updated_at: new Date().toISOString()
        };

        setProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p));
        return updatedProperty;
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error updating property:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        // Data
        properties: getSafeProperties(),
        featuredProperties: getSafeFeaturedProperties(),
        favorites,
        searchResults,
        isLoading,
        searchFilters,
        propertyStats,
        
        // Functions
        getProperties,
        getFeaturedProperties,
        getPropertyStats,
        getFavorites,
        searchProperties,
        getPropertyDetails,
        toggleFavorite,
        setSearchFilters,
        clearSearchResults,
        addProperty,
        updateProperty,
        getSafeProperties,
        getSafeFeaturedProperties,
        
        // State setters
        setProperties,
        setFeaturedProperties,
        setFavorites,
        setSearchResults,
        setIsLoading,
        setPropertyStats,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};