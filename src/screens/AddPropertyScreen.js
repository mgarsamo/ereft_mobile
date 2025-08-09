import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';

const AddPropertyScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addProperty } = useProperty();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    propertyType: 'house',
    listingType: 'sale',
    bedrooms: '',
    bathrooms: '',
    area_sqm: '',
    address: '',
    city: '',
    sub_city: '',
    kebele: '',
    street_name: '',
    house_number: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.title || !formData.price || !formData.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Submit to API
      const newProperty = await addProperty(formData);
      
      // Show success message and navigate to property detail
      Alert.alert(
        'Success',
        'Property listed successfully! It is now live.',
        [
          {
            text: 'View Property',
            onPress: () => navigation.navigate('PropertyDetail', { property: newProperty })
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                description: '',
                propertyType: 'house',
                listingType: 'sale',
                price: '',
                bedrooms: '1',
                bathrooms: '1',
                area_sqm: '',
                address: '',
                city: '',
                sub_city: '',
                kebele: '',
              });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add property. Please try again.');
      console.error('Error adding property:', error);
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
      <Text style={styles.headerTitle}>Add Property</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderFormSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInput = (label, field, placeholder, keyboardType = 'default', required = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderPicker = (label, field, options) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              formData[field] === option.value && styles.pickerOptionSelected
            ]}
            onPress={() => handleInputChange(field, option.value)}
          >
            <Text style={[
              styles.pickerOptionText,
              formData[field] === option.value && styles.pickerOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        
        <View style={styles.content}>
          {renderFormSection('Basic Information', (
            <>
              {renderInput('Property Title', 'title', 'Enter property title', 'default', true)}
              {renderInput('Description', 'description', 'Describe your property', 'default')}
              {renderInput('Price (ETB)', 'price', 'Enter price', 'numeric', true)}
            </>
          ))}

          {renderFormSection('Property Details', (
            <>
              {renderPicker('Property Type', 'propertyType', [
                { value: 'house', label: 'House' },
                { value: 'apartment', label: 'Apartment' },
                { value: 'condo', label: 'Condo' },
                { value: 'townhouse', label: 'Townhouse' },
                { value: 'land', label: 'Land' },
                { value: 'commercial', label: 'Commercial' },
              ])}
              
              {renderPicker('Listing Type', 'listingType', [
                { value: 'sale', label: 'For Sale' },
                { value: 'rent', label: 'For Rent' },
              ])}
              
              <View style={styles.row}>
                {renderInput('Bedrooms', 'bedrooms', '0', 'numeric')}
                {renderInput('Bathrooms', 'bathrooms', '0', 'numeric')}
              </View>
              
              {renderInput('Area (m²)', 'area_sqm', 'Enter area in square meters', 'numeric')}
            </>
          ))}

          {renderFormSection('Location (Ethiopia)', (
            <>
              {renderInput('Full Address', 'address', 'Enter full address', 'default', true)}
              {renderInput('City', 'city', 'e.g., Addis Ababa', 'default', true)}
              {renderInput('Sub-City', 'sub_city', 'e.g., Bole, Kirkos', 'default')}
              {renderInput('Kebele', 'kebele', 'Enter kebele/ward', 'default')}
              {renderInput('Street Name', 'street_name', 'Enter street name', 'default')}
              {renderInput('House Number', 'house_number', 'Enter house/building number', 'default')}
            </>
          ))}

          <View style={styles.submitSection}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Icon name="check" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  required: {
    color: '#DC3545',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  pickerOptionSelected: {
    backgroundColor: '#006AFF',
    borderColor: '#006AFF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#6C757D',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006AFF',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default AddPropertyScreen;
