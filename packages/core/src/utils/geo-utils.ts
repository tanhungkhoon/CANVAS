export type BoundingBox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

/**
 * Checks whether a 2D point [lng, lat] is inside a single ring using the ray-casting algorithm.
 */
function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Checks whether a 2D point [lng, lat] is inside a GeoJSON Polygon (exterior ring minus holes).
 */
function pointInSinglePolygon(point: [number, number], coordinates: number[][][]): boolean {
  if (coordinates.length === 0) return false;
  if (!pointInRing(point, coordinates[0])) {
    return false;
  }
  for (let i = 1; i < coordinates.length; i++) {
    if (pointInRing(point, coordinates[i])) {
      return false; // Point falls inside a hole
    }
  }
  return true;
}

/**
 * Tests whether a point [lng, lat] falls within a GeoJSON Polygon or MultiPolygon.
 * Uses ray-casting algorithm; pure TypeScript without external geometry libraries.
 */
export function pointInPolygon(
  point: [number, number],
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): boolean {
  if (geometry.type === 'Polygon') {
    return pointInSinglePolygon(point, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    for (const polygonCoords of geometry.coordinates) {
      if (pointInSinglePolygon(point, polygonCoords)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Computes the bounding box [minLng, minLat, maxLng, maxLat] for a GeoJSON Polygon or MultiPolygon.
 * Applies a default expansion factor (0.1°) to prevent missing small country centroid coordinates.
 */
export function getBoundingBox(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  expansion: number = 0.1
): BoundingBox {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processRing(ring: number[][]) {
    for (const coord of ring) {
      const lng = coord[0];
      const lat = coord[1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      processRing(ring);
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        processRing(ring);
      }
    }
  }

  if (minLng === Infinity) {
    return [-180, -90, 180, 90];
  }

  // Expand bounding box by factor to prevent boundary cutoff on small features
  minLng = Math.max(-180, minLng - expansion);
  minLat = Math.max(-90, minLat - expansion);
  maxLng = Math.min(180, maxLng + expansion);
  maxLat = Math.min(90, maxLat + expansion);

  return [minLng, minLat, maxLng, maxLat];
}
