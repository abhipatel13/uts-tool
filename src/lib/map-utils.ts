/**
 * Utility functions for map bounds calculation and optimal zoom/center determination
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  center: LatLng;
  zoom: number;
}

/**
 * Calculate the optimal zoom level and center point for a set of geographic coordinates
 * Handles edge cases like very far apart points, antipodal points, and single points
 */
export function calculateOptimalMapBounds(points: LatLng[], options?: {
  padding?: number;
  maxZoom?: number;
  minZoom?: number;
  defaultZoom?: number;
}): MapBounds {
  const {
    padding = 0.1, // 10% padding around the bounds
    maxZoom = 15,
    minZoom = 1,
    defaultZoom = 8
  } = options || {};

  // Handle empty or single point cases
  if (points.length === 0) {
    return {
      center: { lat: 39.8283, lng: -98.5795 }, // Center of US
      zoom: defaultZoom
    };
  }

  if (points.length === 1) {
    return {
      center: points[0],
      zoom: 12 // Good zoom level for single point
    };
  }

  // Filter out invalid points
  const validPoints = points.filter(point => 
    !isNaN(point.lat) && !isNaN(point.lng) &&
    point.lat >= -90 && point.lat <= 90 &&
    point.lng >= -180 && point.lng <= 180
  );

  if (validPoints.length === 0) {
    return {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: defaultZoom
    };
  }

  if (validPoints.length === 1) {
    return {
      center: validPoints[0],
      zoom: 12
    };
  }

  // Calculate bounds
  const lats = validPoints.map(p => p.lat);
  const lngs = validPoints.map(p => p.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Handle longitude wrapping (crossing international date line)
  let lngSpan = maxLng - minLng;
  let centerLng = (minLng + maxLng) / 2;
  
  // Check if points might be spanning the date line
  if (lngSpan > 180) {
    // Recalculate assuming we cross the date line
    const adjustedLngs = lngs.map(lng => lng < 0 ? lng + 360 : lng);
    const adjustedMinLng = Math.min(...adjustedLngs);
    const adjustedMaxLng = Math.max(...adjustedLngs);
    const adjustedSpan = adjustedMaxLng - adjustedMinLng;
    
    if (adjustedSpan < lngSpan) {
      lngSpan = adjustedSpan;
      centerLng = ((adjustedMinLng + adjustedMaxLng) / 2) % 360;
      if (centerLng > 180) centerLng -= 360;
    }
  }

  const latSpan = maxLat - minLat;
  const centerLat = (minLat + maxLat) / 2;

  // Add padding
  const paddedLatSpan = latSpan * (1 + padding);
  const paddedLngSpan = lngSpan * (1 + padding);

  // Calculate zoom level based on the larger span
  // These are rough approximations - Google Maps zoom levels
  const maxSpan = Math.max(paddedLatSpan, paddedLngSpan);
  
  let zoom: number;
  
  if (maxSpan >= 360) {
    zoom = 1; // World view
  } else if (maxSpan >= 180) {
    zoom = 2; // Hemisphere
  } else if (maxSpan >= 90) {
    zoom = 3; // Large continent
  } else if (maxSpan >= 45) {
    zoom = 4; // Continent
  } else if (maxSpan >= 22.5) {
    zoom = 5; // Large country
  } else if (maxSpan >= 11.25) {
    zoom = 6; // Country
  } else if (maxSpan >= 5.625) {
    zoom = 7; // Large state/province
  } else if (maxSpan >= 2.813) {
    zoom = 8; // State/province
  } else if (maxSpan >= 1.406) {
    zoom = 9; // Large county
  } else if (maxSpan >= 0.703) {
    zoom = 10; // County
  } else if (maxSpan >= 0.352) {
    zoom = 11; // Large city
  } else if (maxSpan >= 0.176) {
    zoom = 12; // City
  } else if (maxSpan >= 0.088) {
    zoom = 13; // Town
  } else if (maxSpan >= 0.044) {
    zoom = 14; // Large neighborhood
  } else {
    zoom = 15; // Neighborhood
  }

  // Ensure zoom is within bounds
  zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

  return {
    center: { lat: centerLat, lng: centerLng },
    zoom
  };
}

/**
 * Convert a location string (lat, lng format) to LatLng object
 */
export function parseLocationString(location: string): LatLng | null {
  if (!location || typeof location !== 'string') {
    return null;
  }

  const parts = location.split(',');
  if (parts.length !== 2) {
    return null;
  }

  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Validate bounds
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

/**
 * Extract valid coordinates from data objects with location property
 */
export function extractCoordinatesFromData<T extends { location?: string }>(
  data: T[]
): LatLng[] {
  return data
    .map(item => item.location ? parseLocationString(item.location) : null)
    .filter((coords): coords is LatLng => coords !== null);
}

/**
 * Calculate distance between two points using Haversine formula (in kilometers)
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
