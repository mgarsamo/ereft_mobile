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
    total_properties: 0,
    for_sale: 0,
    for_rent: 0,
    average_price: 0
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
          
          // No fallback - keep current stats or set to zero
          console.log('📊 PropertyContext: API failed, keeping current stats');
          return propertyStats;
        }
      } else {
        console.log('📊 PropertyContext: Not authenticated, keeping zero stats');
        // Not authenticated, keep zero stats
        return propertyStats;
      }
    } catch (error) {
      console.error('📊 PropertyContext: Error fetching property stats:', error);
      
      // No fallback - keep current stats
      return propertyStats;
    }
  };

  // Demo property statistics - return empty stats
  const getDemoPropertyStats = () => {
    return {
      total_properties: 0,
      for_sale: 0,
      for_rent: 0,
      average_price: 0,
      total_views: 0,
      featured_properties: 0,
    };
  };

  // Upload images to Cloudinary with crash prevention
  const uploadImagesToCloudinary = async (images) => {
    try {
      console.log('🏠 PropertyContext: Starting Cloudinary upload for', images.length, 'images');
      
      // Validate input
      if (!images || !Array.isArray(images) || images.length === 0) {
        console.log('🏠 PropertyContext: No valid images to upload');
        return [];
      }

      // Validate environment variables
      if (!ENV.CLOUDINARY_UPLOAD_PRESET || !ENV.CLOUDINARY_CLOUD_NAME || !ENV.CLOUDINARY_API_URL) {
        console.error('🏠 PropertyContext: Missing Cloudinary configuration');
        throw new Error('Cloudinary configuration is missing');
      }

      const uploadedImages = [];
      
      // Process images sequentially to prevent crashes
      for (let i = 0; i < images.length; i++) {
        try {
          const imageUri = images[i];
          console.log(`🏠 PropertyContext: Processing image ${i + 1}/${images.length}`);
          
          // Validate image object (Expo ImagePicker returns {uri, type, name})
          if (!imageUri || typeof imageUri !== 'object' || !imageUri.uri) {
            console.warn(`🏠 PropertyContext: Invalid image object for image ${i + 1}, skipping`);
            continue;
          }

          // Create form data safely
          const formData = new FormData();
          
          // Safely append file with proper error handling
          try {
            formData.append('file', {
              uri: imageUri.uri,
              type: imageUri.type || 'image/jpeg',
              name: imageUri.name || `property_image_${Date.now()}_${i}.jpg`
            });
            formData.append('upload_preset', ENV.CLOUDINARY_UPLOAD_PRESET);
            formData.append('cloud_name', ENV.CLOUDINARY_CLOUD_NAME);
          } catch (formDataError) {
            console.error(`🏠 PropertyContext: FormData creation failed for image ${i + 1}:`, formDataError);
            continue;
          }

          // Upload with timeout and proper error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          try {
            const response = await fetch(ENV.CLOUDINARY_API_URL, {
              method: 'POST',
              body: formData,
              signal: controller.signal,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.secure_url) {
              console.log(`🏠 PropertyContext: Image ${i + 1} uploaded successfully`);
              uploadedImages.push({
                url: result.secure_url,
                public_id: result.public_id || `img_${Date.now()}_${i}`,
                width: result.width || 0,
                height: result.height || 0
              });
            } else {
              console.warn(`🏠 PropertyContext: Image ${i + 1} upload response missing secure_url`);
            }
            
          } catch (uploadError) {
            clearTimeout(timeoutId);
            if (uploadError.name === 'AbortError') {
              console.warn(`🏠 PropertyContext: Image ${i + 1} upload timed out`);
            } else {
              console.error(`🏠 PropertyContext: Image ${i + 1} upload failed:`, uploadError.message);
            }
            // Continue with next image instead of crashing
          }
          
        } catch (imageError) {
          console.error(`🏠 PropertyContext: Critical error processing image ${i + 1}:`, imageError);
          // Continue with next image instead of crashing
        }
      }
      
      console.log(`🏠 PropertyContext: Upload completed. ${uploadedImages.length}/${images.length} images uploaded successfully`);
      return uploadedImages;
      
    } catch (error) {
      console.error('🏠 PropertyContext: Critical error in Cloudinary upload:', error);
      // Return empty array instead of crashing
      return [];
    }
  };

  // Initialize properties and featured properties on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🏠 PropertyContext: Initializing property data...');
        
        // Initialize with empty data - no hardcoded demo data
        setProperties([]);
        setFeaturedProperties([]);
        setPropertyStats(getDemoPropertyStats());
        
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
          console.log('🏠 PropertyContext: User not authenticated, showing empty state');
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
    return properties || [];
  };

  // Helper function to safely get featured properties array
  const getSafeFeaturedProperties = () => {
    return featuredProperties || [];
  };

  // No demo data - production only

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
            console.log('🏠 PropertyContext: No properties returned from API, keeping empty state');
            setProperties([]);
            return { results: [], count: 0 };
          }
        } catch (apiError) {
          console.error('🏠 PropertyContext: API fetch failed:', apiError.message);
          console.error('🏠 PropertyContext: API error details:', apiError.response?.data);
          
          // If it's an authentication error, clear the token
          if (apiError.response?.status === 401) {
            console.log('🏠 PropertyContext: Authentication error, clearing token');
            // You might want to trigger a logout here
          }
          
          // No fallback - keep empty state
          setProperties([]);
          return { results: [], count: 0 };
        }
      } else {
        console.log('🏠 PropertyContext: Not authenticated or no API, keeping empty state');
        // Not authenticated, keep empty state
        setProperties([]);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error in getProperties:', error);
      
      // No fallback - keep empty state
      setProperties([]);
      return { results: [], count: 0 };
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
          
          // No fallback - keep empty state
          console.log('🏠 PropertyContext: API failed, keeping empty featured properties');
          setFeaturedProperties([]);
          return [];
        }
      } else {
        console.log('🏠 PropertyContext: Not authenticated, keeping empty featured properties');
        // Not authenticated, keep empty state
        setFeaturedProperties([]);
        return [];
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Error fetching featured properties:', error);
      
      // No fallback - keep empty state
      setFeaturedProperties([]);
      return [];
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
      
      // No fallback - return null if property not found
      return null;
    } catch (error) {
      console.error('Error fetching property details:', error);
      // No fallback - return null
      return null;
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
            console.log('🔍 PropertyContext: No search results from API, keeping empty state');
            // No results from API, keep empty state
            setSearchResults([]);
            setSearchFilters({ query, ...filters });
            return { results: [], count: 0 };
          }
        } catch (apiError) {
          console.error('🔍 PropertyContext: Search API failed:', apiError.message);
          console.error('🔍 PropertyContext: Search API error details:', apiError.response?.data);
          
          // No fallback - keep empty state
          console.log('🔍 PropertyContext: API failed, keeping empty search results');
          setSearchResults([]);
          setSearchFilters({ query, ...filters });
          return { results: [], count: 0 };
        }
      } else {
        // Not authenticated, keep empty state
        console.log('🔍 PropertyContext: Not authenticated, keeping empty search results');
        setSearchResults([]);
        setSearchFilters({ query, ...filters });
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('🔍 PropertyContext: Error searching properties:', error);
      
      // No fallback - keep empty state
      setSearchResults([]);
      return { results: [], count: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  // No demo filtering - production only

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
          
          // No fallback - keep empty state
          console.log('❤️ PropertyContext: API failed, keeping empty favorites');
          setFavorites([]);
          return [];
        }
      } else {
        console.log('❤️ PropertyContext: Not authenticated, keeping empty favorites');
        // Not authenticated, keep empty state
        setFavorites([]);
        return [];
      }
    } catch (error) {
      console.error('❤️ PropertyContext: Error fetching favorites:', error);
      
      // No fallback - keep empty state
      setFavorites([]);
      return [];
    }
  };

  // No demo favorites - production only

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

  // Add new property with crash prevention - PRODUCTION READY
  const addProperty = async (propertyData) => {
    // Wrapper try-catch to prevent any crashes
    try {
      console.log('🏠 PropertyContext: Adding new property:', propertyData);
      setIsLoading(true);

      // Initialize imageUrls at function scope to prevent ReferenceError
      let imageUrls = [];
      let cloudinaryUploadSuccess = false;

      if (api && isAuthenticated) {
        try {
          // Handle image uploads to Cloudinary first
          if (propertyData.images && propertyData.images.length > 0) {
            console.log('🏠 PropertyContext: Uploading images to Cloudinary...');
            try {
              // Upload images to Cloudinary and get URLs
              imageUrls = await uploadImagesToCloudinary(propertyData.images);
              console.log('🏠 PropertyContext: Images uploaded successfully:', imageUrls);
              
              // If no images were uploaded successfully, continue with property creation
              if (imageUrls.length === 0) {
                console.warn('🏠 PropertyContext: No images uploaded successfully, continuing with property creation');
              } else {
                cloudinaryUploadSuccess = true;
              }
            } catch (uploadError) {
              console.error('🏠 PropertyContext: Image upload failed:', uploadError);
              // Don't crash the app - continue with property creation without images
              console.log('🏠 PropertyContext: Continuing with property creation despite image upload failure');
              imageUrls = []; // Ensure imageUrls is empty array on failure
            }
          }

          // Prepare property data for backend - PRODUCTION READY
          const propertyPayload = {
            title: propertyData.title || '',
            description: propertyData.description || '',
            price: parseFloat(propertyData.price) || 0,
            property_type: propertyData.propertyType || 'house',
            listing_type: propertyData.listingType || 'sale',
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseFloat(propertyData.bathrooms) || 0,
            area_sqm: parseFloat(propertyData.area_sqm) || 0,
            address: propertyData.address || '',
            city: propertyData.city || '',
            sub_city: propertyData.sub_city || '',
            kebele: propertyData.kebele || '',
            street_name: propertyData.street_name || '',
            house_number: propertyData.house_number || '',
            is_featured: false,
            is_active: true,
            is_published: true,
            status: 'active',
            // Include images field with Cloudinary URLs
            images: imageUrls.map(img => img.url || img) || []
          };

          console.log('🏠 PropertyContext: Sending property payload:', propertyPayload);
          
          // Send to backend with proper error handling
          const response = await api.post('/api/properties/', propertyPayload);
          console.log('🏠 PropertyContext: Property added successfully:', response.data);

          // Add to local state with uploaded images
          const newProperty = {
            ...response.data,
            images: imageUrls, // Now properly scoped
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
          
          // Enhanced error logging for production debugging
          if (apiError.response) {
            console.error('🏠 PropertyContext: API Error Status:', apiError.response.status);
            console.error('🏠 PropertyContext: API Error Data:', apiError.response.data);
            console.error('🏠 PropertyContext: API Error Headers:', apiError.response.headers);
          }
          
          // Don't crash - create local property as fallback
          console.log('🏠 PropertyContext: Creating local property as fallback due to API failure');
          const localProperty = {
            id: Date.now().toString(),
            ...propertyData,
            images: imageUrls, // Now properly scoped
            created_at: new Date().toISOString(),
            is_favorite: false,
            owner: user || { name: 'Local User' }
          };
          setProperties(prev => [localProperty, ...prev]);
          return localProperty;
        }
      } else {
        // Not authenticated, create local property
        console.log('🏠 PropertyContext: Not authenticated, creating local property');
        const localProperty = {
          id: Date.now().toString(),
          ...propertyData,
          images: imageUrls, // Now properly scoped
          created_at: new Date().toISOString(),
          is_favorite: false,
          owner: user || { name: 'Local User' }
        };

        setProperties(prev => [localProperty, ...prev]);
        return localProperty;
      }
    } catch (error) {
      console.error('🏠 PropertyContext: Critical error adding property:', error);
      // Return a fallback property to prevent crash
      const fallbackProperty = {
        id: Date.now().toString(),
        title: propertyData.title || 'Property',
        description: propertyData.description || '',
        price: propertyData.price || 0,
        property_type: propertyData.propertyType || 'house',
        listing_type: propertyData.listingType || 'sale',
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        area_sqm: propertyData.area_sqm || 0,
        address: propertyData.address || '',
        city: propertyData.city || '',
        images: [], // Always ensure images is an array
        created_at: new Date().toISOString(),
        is_favorite: false,
        owner: user || { name: 'Local User' }
      };
      
      setProperties(prev => [fallbackProperty, ...prev]);
      return fallbackProperty;
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing property - PRODUCTION READY
  const updateProperty = async (propertyId, propertyData) => {
    try {
      console.log('🏠 PropertyContext: Updating property:', propertyId, propertyData);
      setIsLoading(true);

      // Initialize imageUrls at function scope to prevent ReferenceError
      let imageUrls = [];

      if (api && isAuthenticated) {
        try {
          // Handle image uploads to Cloudinary first if new images are provided
          if (propertyData.images && propertyData.images.length > 0) {
            console.log('🏠 PropertyContext: Uploading new images to Cloudinary for update...');
            try {
              // Upload images to Cloudinary and get URLs
              imageUrls = await uploadImagesToCloudinary(propertyData.images);
              console.log('🏠 PropertyContext: New images uploaded successfully:', imageUrls);
              
              // If no images were uploaded successfully, continue with property update
              if (imageUrls.length === 0) {
                console.warn('🏠 PropertyContext: No new images uploaded successfully, continuing with property update');
              }
            } catch (uploadError) {
              console.error('🏠 PropertyContext: Image upload failed during update:', uploadError);
              // Don't crash the app - continue with property update without images
              console.log('🏠 PropertyContext: Continuing with property update despite image upload failure');
              imageUrls = []; // Ensure imageUrls is empty array on failure
            }
          }

          // Prepare property data for backend - PRODUCTION READY
          const propertyPayload = {
            title: propertyData.title || '',
            description: propertyData.description || '',
            price: parseFloat(propertyData.price) || 0,
            property_type: propertyData.propertyType || 'house',
            listing_type: propertyData.listingType || 'sale',
            bedrooms: parseInt(propertyData.bedrooms) || 0,
            bathrooms: parseFloat(propertyData.bathrooms) || 0,
            area_sqm: parseFloat(propertyData.area_sqm) || 0,
            address: propertyData.address || '',
            city: propertyData.city || '',
            sub_city: propertyData.sub_city || '',
            kebele: propertyData.kebele || '',
            street_name: propertyData.street_name || '',
            house_number: propertyData.house_number || '',
            // Include images field with Cloudinary URLs
            images: imageUrls.map(img => img.url || img) || []
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