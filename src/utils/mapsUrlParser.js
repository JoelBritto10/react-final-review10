/**
 * Google Maps URL Parser Utility
 * Extracts coordinates from various Google Maps URL formats
 */

/**
 * Extract coordinates from a shortened Google Maps URL
 * Only supports: https://maps.app.goo.gl/[code]
 * The app will expand the shortened URL to extract coordinates
 */
export const extractCoordinatesFromUrl = async (url) => {
  try {
    let processedUrl = url.trim();

    // For shortened URLs (maps.app.goo.gl), just accept them as-is
    if (processedUrl.includes('maps.app.goo.gl')) {
      // Use the shortened URL directly as a location identifier
      // Return a special response that indicates we're using a shortened link
      return {
        success: true,
        isShortened: true,
        shortUrl: processedUrl,
        lat: 0, // Placeholder - the shortened URL will be displayed instead
        lng: 0
      };
    }

    // If it's not a shortened URL, reject it
    return {
      success: false,
      error: 'Only shortened Google Maps links (maps.app.goo.gl) are accepted'
    };
  } catch (error) {
    console.error('Error parsing maps URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate if a string is a shortened Google Maps URL (ONLY maps.app.goo.gl)
 */
export const isValidGoogleMapsUrl = (url) => {
  // Only accept shortened Google Maps URLs
  return /https?:\/\/maps\.app\.goo\.gl\/.+/.test(url);
};

/**
 * Create a standard Google Maps URL from coordinates
 */
export const createGoogleMapsUrl = (lat, lng, zoom = 15) => {
  return `https://www.google.com/maps/@${lat},${lng},${zoom}z`;
};

/**
 * Extract place name from different URL formats if available
 */
export const extractPlaceName = (url) => {
  try {
    // Try to extract from search query
    const searchMatch = url.match(/search\/([^?&]+)/);
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    }

    // Try to extract from q parameter
    const qMatch = url.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      const placeName = decodeURIComponent(qMatch[1]);
      // Filter out coordinate-only results
      if (!placeName.match(/^-?\d+\.\d+,-?\d+\.\d+$/)) {
        return placeName;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting place name:', error);
    return null;
  }
};

const mapsUrlParser = {
  extractCoordinatesFromUrl,
  isValidGoogleMapsUrl,
  createGoogleMapsUrl,
  extractPlaceName
};

export default mapsUrlParser;
