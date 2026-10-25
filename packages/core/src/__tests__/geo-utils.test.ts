import { describe, it, expect } from 'vitest';
import { pointInPolygon, getBoundingBox } from '../utils/geo-utils.js';

describe('Geo Utilities (Point-in-Polygon & Bounding Box)', () => {
  // A simple 10x10 square polygon centered around (5, 5)
  const squarePolygon: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ],
  };

  // Concave "L-shape" polygon: 0..10 on x, 0..10 on y, with upper-right quadrant (5..10, 5..10) cut out
  const concavePolygon: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 5],
        [5, 5],
        [5, 10],
        [0, 10],
        [0, 0],
      ],
    ],
  };

  // MultiPolygon with two distinct squares: [0..10, 0..10] and [20..30, 20..30]
  const multiPolygon: GeoJSON.MultiPolygon = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
      [
        [
          [20, 20],
          [30, 20],
          [30, 30],
          [20, 30],
          [20, 20],
        ],
      ],
    ],
  };

  it('ray-casting returns true for point clearly inside a known polygon', () => {
    expect(pointInPolygon([5, 5], squarePolygon)).toBe(true);
    expect(pointInPolygon([1, 1], squarePolygon)).toBe(true);
    expect(pointInPolygon([9, 9], squarePolygon)).toBe(true);
  });

  it('ray-casting returns false for point clearly outside', () => {
    expect(pointInPolygon([15, 5], squarePolygon)).toBe(false);
    expect(pointInPolygon([-1, 5], squarePolygon)).toBe(false);
    expect(pointInPolygon([5, -1], squarePolygon)).toBe(false);
    expect(pointInPolygon([5, 11], squarePolygon)).toBe(false);
  });

  it('correctly handles boundary edges consistently', () => {
    // A point far outside is always false
    expect(pointInPolygon([100, 100], squarePolygon)).toBe(false);
  });

  it('correctly tests point containment in concave polygon', () => {
    // Inside the bottom branch
    expect(pointInPolygon([7, 2], concavePolygon)).toBe(true);
    // Inside the left branch
    expect(pointInPolygon([2, 7], concavePolygon)).toBe(true);
    // In the hollow/cutout quadrant (7, 7) -> should be false
    expect(pointInPolygon([7, 7], concavePolygon)).toBe(false);
  });

  it('correctly tests point containment in multi-polygon', () => {
    // Point inside first polygon
    expect(pointInPolygon([5, 5], multiPolygon)).toBe(true);
    // Point inside second polygon
    expect(pointInPolygon([25, 25], multiPolygon)).toBe(true);
    // Point in between polygons
    expect(pointInPolygon([15, 15], multiPolygon)).toBe(false);
  });

  it('getBoundingBox computes bbox and includes expansion factor', () => {
    const bbox = getBoundingBox(squarePolygon);
    // minLng <= 0, minLat <= 0, maxLng >= 10, maxLat >= 10
    expect(bbox[0]).toBeLessThanOrEqual(0);
    expect(bbox[1]).toBeLessThanOrEqual(0);
    expect(bbox[2]).toBeGreaterThanOrEqual(10);
    expect(bbox[3]).toBeGreaterThanOrEqual(10);
  });

  it('bounding-box pre-filter discards points outside bbox', () => {
    const [minLng, minLat, maxLng, maxLat] = getBoundingBox(squarePolygon);
    const outsidePoint = [50, 50];
    const insideBbox =
      outsidePoint[0] >= minLng &&
      outsidePoint[0] <= maxLng &&
      outsidePoint[1] >= minLat &&
      outsidePoint[1] <= maxLat;
    expect(insideBbox).toBe(false);
  });

  it('handles very small country bounding regions like Monaco (MC)', () => {
    // Monaco roughly at [7.42, 43.738]
    const monacoCoord: [number, number] = [7.42, 43.738];
    // A tiny polygon simulating Monaco (approx 0.02° x 0.02°)
    const monacoPolygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [7.41, 43.73],
          [7.43, 43.73],
          [7.43, 43.75],
          [7.41, 43.75],
          [7.41, 43.73],
        ],
      ],
    };

    const bbox = getBoundingBox(monacoPolygon, 0.1);
    // Bbox should be expanded by 0.1° on each side
    expect(bbox[0]).toBeCloseTo(7.31, 2);
    expect(bbox[1]).toBeCloseTo(43.63, 2);
    expect(bbox[2]).toBeCloseTo(7.53, 2);
    expect(bbox[3]).toBeCloseTo(43.85, 2);

    expect(pointInPolygon(monacoCoord, monacoPolygon)).toBe(true);
  });
});
