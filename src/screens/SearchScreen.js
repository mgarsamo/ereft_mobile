import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProperty } from '../context/PropertyContext';

const { width } = Dimensions.get('window');

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { searchProperties, isLoading } = useProperty();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    propertyType: route.params?.propertyType || '',
    listingType: route.params?.type || '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    city: '',
  });
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // Handle route params for filtering
    if (route.params?.type) {
      setFilters(prev => ({ ...prev, listingType: route.params.type }));
    }
    if (route.params?.propertyType) {
      setFilters(prev => ({ ...prev, propertyType: route.params.propertyType }));
      // Auto-search when category is selected
      performSearch(route.params.query || '', { 
        ...filters, 
        propertyType: route.params.propertyType 
      });
    }
    if (route.params?.query) {
      setSearchQuery(route.params.query);
      performSearch(route.params.query, filters);
    }
  }, [route.params]);

  const performSearch = async (query, searchFilters) => {
    try {
      const results = await searchProperties(query, searchFilters);
      setSearchResults(results.results || []);
    } catch (error) {
      console.error('Search error:', error);
      // Show empty state instead of crashing
      setSearchResults([]);
    }
  };

  const handleSearch = async () => {
    await performSearch(searchQuery, filters);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Search Properties</Text>
      <TouchableOpacity style={styles.filterButton}>
        <Icon name="tune" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#6C757D" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by address, city, or ZIP"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#6C757D" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Icon name="search" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.filterChip, filters.propertyType === 'house' && styles.filterChipActive]}
          onPress={() => handleFilterChange('propertyType', filters.propertyType === 'house' ? '' : 'house')}
        >
          <Text style={[styles.filterChipText, filters.propertyType === 'house' && styles.filterChipTextActive]}>
            House
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, filters.propertyType === 'apartment' && styles.filterChipActive]}
          onPress={() => handleFilterChange('propertyType', filters.propertyType === 'apartment' ? '' : 'apartment')}
        >
          <Text style={[styles.filterChipText, filters.propertyType === 'apartment' && styles.filterChipTextActive]}>
            Apartment
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, filters.listingType === 'sale' && styles.filterChipActive]}
          onPress={() => handleFilterChange('listingType', filters.listingType === 'sale' ? '' : 'sale')}
        >
          <Text style={[styles.filterChipText, filters.listingType === 'sale' && styles.filterChipTextActive]}>
            For Sale
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, filters.listingType === 'rent' && styles.filterChipActive]}
          onPress={() => handleFilterChange('listingType', filters.listingType === 'rent' ? '' : 'rent')}
        >
          <Text style={[styles.filterChipText, filters.listingType === 'rent' && styles.filterChipTextActive]}>
            For Rent
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderPropertyCard = (property) => (
    <TouchableOpacity 
      key={property.id}
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { property })}
    >
      <View style={styles.propertyImage}>
        <Icon name="home" size={40} color="#E9ECEF" />
      </View>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>{property.title}</Text>
        <Text style={styles.propertyPrice}>ETB {property.price?.toLocaleString()}</Text>
        <Text style={styles.propertyLocation}>{property.address}</Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetail}>{property.bedrooms} beds</Text>
          <Text style={styles.propertyDetail}>•</Text>
          <Text style={styles.propertyDetail}>{property.bathrooms} baths</Text>
          <Text style={styles.propertyDetail}>•</Text>
          <Text style={styles.propertyDetail}>{property.area_sqm} m²</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderResults = () => {
    if (searchResults.length === 0 && searchQuery) {
      return (
        <View style={styles.emptyState}>
          <Icon name="search-off" size={48} color="#E9ECEF" />
          <Text style={styles.emptyStateText}>No properties found</Text>
          <Text style={styles.emptyStateSubtext}>Try adjusting your search criteria</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        {searchResults.map(renderPropertyCard)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderSearchBar()}
        {renderFilters()}
        {renderResults()}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#006AFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#006AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#006AFF',
    borderColor: '#006AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6C757D',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006AFF',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyDetail: {
    fontSize: 12,
    color: '#6C757D',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default SearchScreen;
