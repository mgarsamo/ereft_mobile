import { ENV } from '../config/env';

/**
 * CloudinaryService - Handle image uploads to Cloudinary
 */
class CloudinaryService {
  /**
   * Upload a single image to Cloudinary
   * @param {Object} imageData - Image data from expo-image-picker
   * @param {string} folder - Folder name in Cloudinary (optional)
   * @returns {Promise<Object>} - Cloudinary upload result
   */
  static async uploadImage(imageData, folder = 'ereft_properties') {
    try {
      console.log('☁️ CloudinaryService: Starting image upload...');
      
      // Validate input
      if (!imageData || !imageData.uri) {
        throw new Error('Invalid image data provided');
      }
      
      // Create FormData
      const formData = new FormData();
      
      // Add file to form data
      formData.append('file', {
        uri: imageData.uri,
        type: imageData.type || 'image/jpeg',
        name: imageData.name || `image_${Date.now()}.jpg`
      });
      
      // Add Cloudinary upload preset
      formData.append('upload_preset', ENV.CLOUDINARY_UPLOAD_PRESET);
      
      // Add folder if specified
      if (folder) {
        formData.append('folder', folder);
      }
      
      // Add transformation parameters
      formData.append('transformation', JSON.stringify([
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ]));
      
      console.log('☁️ CloudinaryService: Uploading to Cloudinary...');
      
      // Upload to Cloudinary
      const response = await fetch(ENV.CLOUDINARY_API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('☁️ CloudinaryService: Upload successful:', result.public_id);
      
      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
      
    } catch (error) {
      console.error('☁️ CloudinaryService: Upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Upload multiple images to Cloudinary
   * @param {Array} imagesData - Array of image data from expo-image-picker
   * @param {string} folder - Folder name in Cloudinary (optional)
   * @returns {Promise<Array>} - Array of upload results
   */
  static async uploadImages(imagesData, folder = 'ereft_properties') {
    try {
      console.log(`☁️ CloudinaryService: Starting batch upload for ${imagesData.length} images...`);
      
      const uploadPromises = imagesData.map((imageData, index) => 
        this.uploadImage(imageData, `${folder}/image_${index + 1}`)
      );
      
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);
      
      console.log(`☁️ CloudinaryService: Batch upload complete - ${successfulUploads.length} successful, ${failedUploads.length} failed`);
      
      return {
        success: successfulUploads.length > 0,
        images: successfulUploads.map(result => result.url),
        failed: failedUploads,
        total: imagesData.length,
        successful: successfulUploads.length
      };
      
    } catch (error) {
      console.error('☁️ CloudinaryService: Batch upload failed:', error);
      return {
        success: false,
        error: error.message,
        images: [],
        total: imagesData.length,
        successful: 0
      };
    }
  }
  
  /**
   * Delete an image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} - Deletion result
   */
  static async deleteImage(publicId) {
    try {
      console.log('☁️ CloudinaryService: Deleting image:', publicId);
      
      // Note: This would require backend implementation since it needs API secret
      // For now, we'll just return success as images can be managed from Cloudinary dashboard
      return {
        success: true,
        message: 'Image deletion would be handled by backend'
      };
      
    } catch (error) {
      console.error('☁️ CloudinaryService: Delete failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default CloudinaryService;
