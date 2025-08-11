// Environment Configuration for Ereft
export const ENV = {
  API_BASE_URL: __DEV__ ? 'http://192.168.12.129:8001' : 'https://ereft.onrender.com',
  
  // Google OAuth Configuration - Google Identity Services (No Firebase)
  GOOGLE_IOS_CLIENT_ID: '91486871350-ic7gbroh747pe9u31gqeidp45tl450i3.apps.googleusercontent.com',
  GOOGLE_ANDROID_CLIENT_ID: '1000845422249-ANDROID_CLIENT_ID_HERE', // Replace with actual Android client ID
  GOOGLE_WEB_CLIENT_ID: '91486871350-79fvub6490473eofjpu1jjlhncuiua44.apps.googleusercontent.com',
  
  // Use appropriate client ID based on platform
  GOOGLE_CLIENT_ID: __DEV__ 
    ? '91486871350-79fvub6490473eofjpu1jjlhncuiua44.apps.googleusercontent.com' // Web client for Expo dev
    : '91486871350-ic7gbroh747pe9u31gqeidp45tl450i3.apps.googleusercontent.com', // iOS client for production
};
