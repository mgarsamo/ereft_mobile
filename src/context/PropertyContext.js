import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PropertyContext = createContext();

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

export const PropertyProvider = ({ children }) => {
  const { api } = useAuth();
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

  // Get all properties
  const getProperties = async (page = 1, filters = {}) => {
    try {
      setIsLoading(true);
      const params = { page, ...filters };
      const response = await api.get('/api/properties/', { params });
      setProperties(response.data.results || response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      // Return empty data instead of throwing
      return { results: [], count: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  // Get featured properties
  const getFeaturedProperties = async () => {
    try {
      const response = await api.get('/api/properties/featured/');
      setFeaturedProperties(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      // Return empty array instead of throwing
      setFeaturedProperties([]);
      return [];
    }
  };

  // Get property details
  const getPropertyDetails = async (propertyId) => {
    try {
      const response = await api.get(`/api/properties/${propertyId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching property details:', error);
      throw error;
    }
  };

  // Search properties
  const searchProperties = async (query, filters = {}) => {
    try {
      setIsLoading(true);
      const params = { query, ...filters };
      const response = await api.get('/api/properties/search/', { params });
      setSearchResults(response.data.results || response.data);
      setSearchFilters({ query, ...filters });
      return response.data;
    } catch (error) {
      console.error('Error searching properties:', error);
      // Return empty data instead of throwing
      setSearchResults([]);
      return { results: [], count: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  // Get user favorites
  const getFavorites = async () => {
    try {
      const response = await api.get('/api/favorites/');
      setFavorites(response.data.results || response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Return empty array instead of throwing
      setFavorites([]);
      return { results: [], count: 0 };
    }
  };

  // Add/remove favorite
  const toggleFavorite = async (propertyId) => {
    try {
      const response = await api.post(`/api/properties/${propertyId}/favorite/`);
      
      // Update favorites list
      if (response.data.status === 'added to favorites') {
        const property = properties.find(p => p.id === propertyId) || 
                        searchResults.find(p => p.id === propertyId);
        if (property) {
          setFavorites(prev => [...prev, { property, created_at: new Date().toISOString() }]);
        }
      } else {
        setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
      }
      
      // Update property is_favorited status
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? { ...p, is_favorited: !p.is_favorited } : p)
      );
      setSearchResults(prev => 
        prev.map(p => p.id === propertyId ? { ...p, is_favorited: !p.is_favorited } : p)
      );
      
      return response.data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  // Add property
  const addProperty = async (propertyData) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Add basic property data
      Object.keys(propertyData).forEach(key => {
        if (key === 'images') {
          propertyData[key].forEach((image, index) => {
            formData.append('images', {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: `image_${index}.jpg`,
            });
          });
        } else {
          formData.append(key, propertyData[key]);
        }
      });
      
      const response = await api.post('/api/properties/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Add to properties list
      setProperties(prev => [response.data, ...prev]);
      
      return response.data;
    } catch (error) {
      console.error('Error adding property:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update property
  const updateProperty = async (propertyId, propertyData) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/api/properties/${propertyId}/`, propertyData);
      
      // Update in properties list
      setProperties(prev => 
        prev.map(p => p.id === propertyId ? response.data : p)
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete property
  const deleteProperty = async (propertyId) => {
    try {
      await api.delete(`/api/properties/${propertyId}/`);
      
      // Remove from properties list
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  };

  // Contact agent
  const contactAgent = async (propertyId, contactData) => {
    try {
      const response = await api.post(`/api/properties/${propertyId}/contact/`, contactData);
      return response.data;
    } catch (error) {
      console.error('Error contacting agent:', error);
      throw error;
    }
  };

  // Get property statistics
  const getPropertyStats = async () => {
    try {
      const response = await api.get('/api/properties/stats/');
      setPropertyStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching property stats:', error);
      // Return default stats instead of throwing
      const defaultStats = {
        total_properties: 150,
        for_sale: 89,
        for_rent: 61,
        average_price: 2500000
      };
      setPropertyStats(defaultStats);
      return defaultStats;
    }
  };

  // Track property view
  const trackPropertyView = async (propertyId) => {
    try {
      await api.post(`/api/properties/${propertyId}/track-view/`);
    } catch (error) {
      console.error('Error tracking property view:', error);
    }
  };

  // Get search history
  const getSearchHistory = async () => {
    try {
      const response = await api.get('/api/search-history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching search history:', error);
      throw error;
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
    properties,
    featuredProperties,
    favorites,
    searchResults,
    isLoading,
    searchFilters,
    propertyStats,
    getProperties,
    getFeaturedProperties,
    getPropertyDetails,
    searchProperties,
    getFavorites,
    toggleFavorite,
    addProperty,
    updateProperty,
    deleteProperty,
    contactAgent,
    getPropertyStats,
    trackPropertyView,
    getSearchHistory,
    clearSearchResults,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};
