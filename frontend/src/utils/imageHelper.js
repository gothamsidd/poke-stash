/**
 * Get image URL - handles both local and external URLs
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, it's a local path - construct backend URL
  // In production, use the API_URL from environment or relative path
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';
  
  if (isProduction) {
    // In production, images should be served from the backend
    // Use the API URL if available, otherwise use relative path
    const apiUrl = process.env.REACT_APP_API_URL || '';
    if (apiUrl) {
      // Remove /api suffix if present, then add image path
      const baseUrl = apiUrl.replace(/\/api$/, '');
      return `${baseUrl}${imagePath}`;
    }
    // Fallback to relative path (assumes backend serves from same domain)
    return imagePath;
  }
  
  // Development: use localhost
  return `http://localhost:5001${imagePath}`;
};
