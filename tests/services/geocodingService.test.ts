import { GeocodingService } from '@/services/geocodingService';
import { LatLng } from '@/schemas/waypoint';

// Mock fetch
global.fetch = jest.fn();

describe('GeocodingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reverseGeocode', () => {
    it('should return address for valid coordinates', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ display_name: '123 Main St, Test City' }),
      });

      const latlng: LatLng = { lat: 51.5, lng: -0.1 };
      const result = await GeocodingService.reverseGeocode(latlng);

      expect(result).toBe('123 Main St, Test City');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=51.5&lon=-0.1'),
        expect.any(Object)
      );
    });

    it('should return coordinate string when API fails', async () => {
      // Mock failed response
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API failed'));

      const latlng: LatLng = { lat: 51.5, lng: -0.1 };
      const result = await GeocodingService.reverseGeocode(latlng);

      expect(result).toBe('51.500000, -0.100000');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const point1: LatLng = { lat: 51.5, lng: -0.1 }; // London
      const point2: LatLng = { lat: 48.8, lng: 2.3 };  // Paris

      const distance = GeocodingService.calculateDistance(point1, point2);

      // The distance between London and Paris is approximately 334 km
      expect(distance).toBeCloseTo(334, 0);
    });

    it('should return 0 for identical points', () => {
      const point: LatLng = { lat: 51.5, lng: -0.1 };

      const distance = GeocodingService.calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('calculateRouteDistance', () => {
    it('should calculate total route distance for multiple waypoints', () => {
      const waypoints = [
        { id: '1', latlng: { lat: 51.5, lng: -0.1 }, address: 'Point 1' },
        { id: '2', latlng: { lat: 52.5, lng: 0.1 }, address: 'Point 2' },
        { id: '3', latlng: { lat: 53.5, lng: 0.2 }, address: 'Point 3' },
      ];

      // Mock the calculateDistance method
      const spy = jest.spyOn(GeocodingService, 'calculateDistance');
      spy.mockReturnValueOnce(100).mockReturnValueOnce(150);

      const totalDistance = GeocodingService.calculateRouteDistance(waypoints);

      expect(totalDistance).toBe(250);
      expect(spy).toHaveBeenCalledTimes(2);

      spy.mockRestore();
    });

    it('should return 0 for less than 2 waypoints', () => {
      const waypoints = [
        { id: '1', latlng: { lat: 51.5, lng: -0.1 }, address: 'Point 1' },
      ];

      const totalDistance = GeocodingService.calculateRouteDistance(waypoints);

      expect(totalDistance).toBe(0);
    });
  });
});
