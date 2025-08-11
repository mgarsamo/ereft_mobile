import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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
    images: [], // Add images array
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prevent accidental navigation when form has data
  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e) => {
        // Check if user has entered any data
        const hasData = Object.values(formData).some(value => 
          value !== '' && value !== 'house' && value !== 'sale' && 
          (Array.isArray(value) ? value.length > 0 : true)
        );
        
        if (hasData) {
          // Prevent default behavior
          e.preventDefault();
          
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Are you sure you want to leave?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) }
            ]
          );
        }
      };

      navigation.addListener('beforeRemove', onBeforeRemove);

      return () => {
        navigation.removeListener('beforeRemove', onBeforeRemove);
      };
    }, [navigation, formData])
  );

  // Debug logging
  useEffect(() => {
    console.log('AddPropertyScreen: Form data updated:', formData);
  }, [formData]);

  // Error boundary for the component
  useEffect(() => {
    const handleError = (error) => {
      console.error('AddPropertyScreen: Component error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    };

    // Add global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      if (args[0]?.includes?.('AddPropertyScreen')) {
        handleError(args[0]);
      }
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Track navigation state changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      console.log('AddPropertyScreen: Navigation state changed:', e.data.state);
    });

    return unsubscribe;
  }, [navigation]);

  // Monitor authentication state changes
  useEffect(() => {
    console.log('AddPropertyScreen: Authentication state - user:', user, 'isAuthenticated:', user ? 'yes' : 'no');
  }, [user]);

  // Persist form data to prevent accidental loss
  useEffect(() => {
    const saveFormData = async () => {
      try {
        await AsyncStorage.setItem('addPropertyFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('AddPropertyScreen: Error saving form data:', error);
      }
    };

    // Save form data whenever it changes
    if (Object.values(formData).some(value => 
      value !== '' && value !== 'house' && value !== 'sale' && 
      (Array.isArray(value) ? value.length > 0 : true)
    )) {
      saveFormData();
    }
  }, [formData]);

  // Load saved form data on component mount
  useEffect(() => {
    console.log('AddPropertyScreen: Component mounted');
    
    const loadFormData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('addPropertyFormData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('AddPropertyScreen: Loading saved form data:', parsedData);
          setFormData(parsedData);
        }
      } catch (error) {
        console.error('AddPropertyScreen: Error loading saved form data:', error);
      }
    };

    loadFormData();

    // Cleanup function to clear saved form data when component unmounts
    return () => {
      console.log('AddPropertyScreen: Component unmounting');
      AsyncStorage.removeItem('addPropertyFormData').catch(error => {
        console.error('AddPropertyScreen: Error clearing saved form data on unmount:', error);
      });
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Request camera and media library permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access is required to upload property images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhoto = async () => {
    if (!(await requestPermissions())) return;
    
    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newImage = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `property_${Date.now()}.jpg`,
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Select photo from gallery
  const selectFromGallery = async () => {
    if (!(await requestPermissions())) return;
    
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `property_${Date.now()}_${Math.random()}.jpg`,
        }));
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images. Please try again.');
      console.error('Gallery error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Reorder images (move to front)
  const moveImageToFront = (index) => {
    if (index === 0) return; // Already at front
    
    setFormData(prev => {
      const newImages = [...prev.images];
      const [movedImage] = newImages.splice(index, 1);
      newImages.unshift(movedImage);
      return { ...prev, images: newImages };
    });
  };

  // Render image gallery
  const renderImageGallery = () => (
    <View style={styles.imageSection}>
      <Text style={styles.sectionTitle}>Property Images</Text>
      <Text style={styles.imageSubtitle}>
        Add high-quality photos to attract more buyers/renters
      </Text>
      
      {/* Image upload buttons */}
      <View style={styles.uploadButtons}>
        <TouchableOpacity 
          style={[styles.uploadButton, styles.cameraButton]} 
          onPress={takePhoto}
          disabled={uploading}
        >
          <Icon name="camera-alt" size={24} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.uploadButton, styles.galleryButton]} 
          onPress={selectFromGallery}
          disabled={uploading}
        >
          <Icon name="photo-library" size={24} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Choose Photos</Text>
        </TouchableOpacity>
      </View>

      {/* Display uploaded images */}
      {formData.images.length > 0 ? (
        <View style={styles.imagesContainer}>
          <Text style={styles.imagesTitle}>
            {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} selected
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
          >
            {formData.images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                
                {/* Image actions */}
                <View style={styles.imageActions}>
                  {index > 0 && (
                    <TouchableOpacity 
                      style={styles.imageActionButton}
                      onPress={() => moveImageToFront(index)}
                    >
                      <Icon name="first-page" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.imageActionButton, styles.removeButton]}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {/* Image number indicator */}
                <View style={styles.imageNumber}>
                  <Text style={styles.imageNumberText}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <Text style={styles.imageTip}>
            💡 First image will be the main photo. Drag to reorder.
          </Text>
        </View>
      ) : (
        <View style={styles.noImagesContainer}>
          <Icon name="add-photo-alternate" size={40} color="#6C757D" />
          <Text style={styles.noImagesText}>
            No images selected yet. Add photos to make your listing more attractive!
          </Text>
        </View>
      )}
      
      {uploading && (
        <View style={styles.uploadingContainer}>
          <Text style={styles.uploadingText}>Processing image...</Text>
        </View>
      )}
    </View>
  );

  const handleSubmit = async () => {
    if (submitting) {
      console.log('AddPropertyScreen: Form submission already in progress, ignoring...');
      return;
    }

    console.log('AddPropertyScreen: Starting form submission...');
    console.log('AddPropertyScreen: Form data:', formData);
    
    // Validate form
    if (!formData.title || !formData.price || !formData.address) {
      console.log('AddPropertyScreen: Form validation failed - missing required fields');
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate that at least one image is selected
    if (!formData.images || formData.images.length === 0) {
      console.log('AddPropertyScreen: Form validation failed - no images selected');
      Alert.alert('Error', 'Please add at least one photo of your property');
      return;
    }

    try {
      setSubmitting(true);
      console.log('AddPropertyScreen: Calling addProperty...');
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
      });
      
      // Submit to API with timeout
      const newProperty = await Promise.race([
        addProperty(formData),
        timeoutPromise
      ]);
      
      console.log('AddPropertyScreen: Property added successfully:', newProperty);
      
      // Show success message and navigate to property detail
      Alert.alert(
        'Success',
        'Property listed successfully! It is now live.',
        [
          {
            text: 'View Property',
            onPress: () => {
              console.log('AddPropertyScreen: Navigating to PropertyDetail...');
              navigation.navigate('PropertyDetail', { property: newProperty });
            }
          },
          {
            text: 'Add Another',
            onPress: () => {
              console.log('AddPropertyScreen: Resetting form...');
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
                street_name: '',
                house_number: '',
                images: [], // Reset images array
              });
              
              // Clear saved form data
              AsyncStorage.removeItem('addPropertyFormData').catch(error => {
                console.error('AddPropertyScreen: Error clearing saved form data:', error);
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('AddPropertyScreen: Error adding property:', error);
      
      if (error.message === 'Request timeout') {
        Alert.alert('Error', 'Request timed out. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to add property. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          // Check if user has entered any data
          const hasData = Object.values(formData).some(value => 
            value !== '' && value !== 'house' && value !== 'sale' && 
            (Array.isArray(value) ? value.length > 0 : true)
          );
          
          if (hasData) {
            Alert.alert(
              'Unsaved Changes',
              'You have unsaved changes. Are you sure you want to leave?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }
              ]
            );
          } else {
            navigation.goBack();
          }
        }}
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

          {renderImageGallery()}

          <View style={styles.submitSection}>
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Icon name="hourglass-empty" size={24} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Adding Property...</Text>
                </>
              ) : (
                <>
                  <Icon name="check" size={24} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Add Property</Text>
                </>
              )}
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  imageSection: {
    marginBottom: 30,
  },
  imageSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 15,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  cameraButton: {
    backgroundColor: '#006AFF',
    marginRight: 5,
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  imagesContainer: {
    marginBottom: 15,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  imagesScroll: {
    height: 100, // Fixed height for horizontal scroll
  },
  imageItem: {
    width: 100, // Fixed width for each image item
    height: 100,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageActions: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  imageActionButton: {
    padding: 5,
  },
  removeButton: {
    backgroundColor: '#DC3545',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  imageNumberText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  imageTip: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 10,
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  uploadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 15,
  },
  noImagesText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AddPropertyScreen;
