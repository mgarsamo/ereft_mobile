// Environment Configuration for Ereft
// Uses environment variables with fallbacks for development
//
// For production deployment:
// 1. Install react-native-config: npm install react-native-config
// 2. Create .env files for different environments
// 3. Update getEnvVar to use react-native-config
// 4. Never commit .env files to version control

const getEnvVar = (key, fallback) => {
  // For MVP: Use fallback values
  // In production, this would use environment-specific builds
  // or react-native-config for environment variables
  return fallback;
};

export const ENV = {
  // API Configuration - MVP: Use Render production backend
  API_BASE_URL: getEnvVar('API_BASE_URL', 'https://ereft.onrender.com'),
  
  // Google Maps API Key for geocoding and maps
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY', ''),
  
  // Google OAuth Configuration
  GOOGLE_WEB_CLIENT_ID: getEnvVar('GOOGLE_WEB_CLIENT_ID', '91486871350-79fvub6490473eofjpu1jjlhncuiua44.apps.googleusercontent.com'),
  GOOGLE_IOS_CLIENT_ID: getEnvVar('GOOGLE_IOS_CLIENT_ID', '91486871350-ic7gbroh747pe9u31gqe1jjlhncuiua44.apps.googleusercontent.com'),
};
