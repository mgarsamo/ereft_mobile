import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const CategoryCard = ({ title, icon, onPress, isSelected = false }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
        <Icon 
          name={icon} 
          size={24} 
          color={isSelected ? '#FFFFFF' : '#006AFF'} 
        />
      </View>
      <Text style={[styles.title, isSelected && styles.selectedTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 8,
  },
  selectedContainer: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  selectedIconContainer: {
    backgroundColor: '#006AFF',
    borderColor: '#006AFF',
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  selectedTitle: {
    color: '#006AFF',
    fontWeight: '600',
  },
});

export default CategoryCard;
