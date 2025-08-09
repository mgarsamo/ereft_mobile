// API Configuration - Production URL
export const API_BASE_URL = 'https://ereft.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  LOGOUT: '/api/auth/logout/',
  TOKEN: '/api/auth/token/',
  
  // User Profile
  PROFILE: '/api/profile/',
  
  // Properties
  PROPERTIES: '/api/properties/',
  PROPERTY_DETAIL: (id) => `/api/properties/${id}/`,
  FEATURED_PROPERTIES: '/api/properties/featured/',
  PROPERTY_SEARCH: '/api/properties/search/',
  PROPERTY_STATS: '/api/properties/stats/',
  PROPERTY_FAVORITE: (id) => `/api/properties/${id}/favorite/`,
  PROPERTY_CONTACT: (id) => `/api/properties/${id}/contact/`,
  PROPERTY_REVIEWS: (id) => `/api/properties/${id}/reviews/`,
  TRACK_PROPERTY_VIEW: (id) => `/api/properties/${id}/track-view/`,
  
  // Favorites
  FAVORITES: '/api/favorites/',
  
  // Search
  SEARCH_HISTORY: '/api/search-history/',
  
  // Neighborhoods
  NEIGHBORHOODS: '/api/neighborhoods/',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Property Types
export const PROPERTY_TYPES = [
  { label: 'House', value: 'house' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Land', value: 'land' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Other', value: 'other' },
];

// Listing Types
export const LISTING_TYPES = [
  { label: 'For Sale', value: 'sale' },
  { label: 'For Rent', value: 'rent' },
  { label: 'Sold', value: 'sold' },
  { label: 'Pending', value: 'pending' },
];

// Price Ranges (in ETB)
export const PRICE_RANGES = [
  { label: 'Under 500,000 ETB', value: { min: 0, max: 500000 } },
  { label: '500,000 - 1,000,000 ETB', value: { min: 500000, max: 1000000 } },
  { label: '1,000,000 - 2,000,000 ETB', value: { min: 1000000, max: 2000000 } },
  { label: '2,000,000 - 5,000,000 ETB', value: { min: 2000000, max: 5000000 } },
  { label: '5,000,000 - 10,000,000 ETB', value: { min: 5000000, max: 10000000 } },
  { label: 'Over 10,000,000 ETB', value: { min: 10000000, max: null } },
];

// Bedroom Options
export const BEDROOM_OPTIONS = [
  { label: 'Any', value: null },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5+', value: 5 },
];

// Bathroom Options
export const BATHROOM_OPTIONS = [
  { label: 'Any', value: null },
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
  { label: '2.5', value: 2.5 },
  { label: '3', value: 3 },
  { label: '3.5', value: 3.5 },
  { label: '4+', value: 4 },
];

// Sort Options
export const SORT_OPTIONS = [
  { label: 'Newest First', value: '-created_at' },
  { label: 'Oldest First', value: 'created_at' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Bedrooms: Low to High', value: 'bedrooms' },
  { label: 'Bedrooms: High to Low', value: '-bedrooms' },
];

// Cities in Ethiopia
export const ETHIOPIAN_CITIES = [
  'Addis Ababa',
  'Dire Dawa',
  'Mekelle',
  'Gondar',
  'Adama',
  'Jimma',
  'Dessie',
  'Bahir Dar',
  'Jijiga',
  'Shashamane',
  'Bishoftu',
  'Arba Minch',
  'Hosaena',
  'Harar',
  'Dilla',
  'Nekemte',
  'Debre Birhan',
  'Asella',
  'Hawassa',
  'Bale Robe',
];

// Contact Types
export const CONTACT_TYPES = [
  { label: 'Property Inquiry', value: 'inquiry' },
  { label: 'Request Showing', value: 'showing' },
  { label: 'General Question', value: 'general' },
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  LOGIN_FAILED: 'Invalid username or password.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  PROPERTY_NOT_FOUND: 'Property not found.',
  FAVORITE_FAILED: 'Failed to update favorites.',
  SEARCH_FAILED: 'Search failed. Please try again.',
  UPLOAD_FAILED: 'Failed to upload. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PROPERTY_ADDED: 'Property added successfully.',
  PROPERTY_UPDATED: 'Property updated successfully.',
  PROPERTY_DELETED: 'Property deleted successfully.',
  FAVORITE_ADDED: 'Added to favorites.',
  FAVORITE_REMOVED: 'Removed from favorites.',
  CONTACT_SENT: 'Message sent successfully.',
  REVIEW_ADDED: 'Review added successfully.',
};
