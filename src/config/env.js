// Environment Configuration for Ereft
export const ENV = {
  API_BASE_URL: 'https://ereft.onrender.com', // Always use live backend
  
  // Google OAuth Configuration - Google Identity Services (No Firebase)
  GOOGLE_IOS_CLIENT_ID: '91486871350-ic7gbroh747pe9u31gqeidp45tl450i3.apps.googleusercontent.com',
  GOOGLE_WEB_CLIENT_ID: '91486871350-79fvub6490473eofjpu1jjlhncuiua44.apps.googleusercontent.com',
  
  // Use web client ID since Google only allows HTTPS redirects
  GOOGLE_CLIENT_ID: '91486871350-79fvub6490473eofjpu1jjlhncuiua44.apps.googleusercontent.com', // Web client for OAuth
  
  // Google Maps API Key for geocoding and maps - Updated from Render environment
  GOOGLE_MAPS_API_KEY: 'AIzaSyAWis-jNmUwxCikA2FG7QqLi-nz7jEvadY',
};
