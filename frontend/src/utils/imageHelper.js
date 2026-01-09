/**
 * Get image URL - handles both local and external URLs
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, it's a local path - prepend backend URL
  return `http://localhost:5001${imagePath}`;
};
