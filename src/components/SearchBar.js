import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const SearchBar = ({ 
  placeholder = "Search by address, city, or ZIP",
  onSearch,
  onVoicePress,
  onFilterPress,
  style,
  value,
  onChangeText,
  showVoiceButton = true,
  showFilterButton = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (onSearch && value) {
      onSearch(value);
    }
  };

  const handleVoicePress = () => {
    if (onVoicePress) {
      onVoicePress();
    }
  };

  const handleFilterPress = () => {
    if (onFilterPress) {
      onFilterPress();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <View style={styles.searchIconContainer}>
          <Icon name="search" size={20} color="#6C757D" />
        </View>
        
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#6C757D"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {value && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChangeText && onChangeText('')}
          >
            <Icon name="close" size={18} color="#6C757D" />
          </TouchableOpacity>
        )}
        
        {showVoiceButton && (
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={handleVoicePress}
          >
            <Icon name="mic" size={20} color="#006AFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {showFilterButton && (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilterPress}
        >
          <Icon name="tune" size={20} color="#006AFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
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
  searchContainerFocused: {
    borderColor: '#006AFF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#006AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  voiceButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
});

export default SearchBar;
