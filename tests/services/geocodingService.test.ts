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
  });

  describe('callNominatimReverseGeocode', () => {
    it('should call Nominatim API with correct parameters', async () => {
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ display_name: '123 Main St, Test City' }),
      });

      await GeocodingService.callNominatimReverseGeocode(51.5, -0.1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=51.5&lon=-0.1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
            'Accept-Language': expect.any(String),
          }),
        })
      );
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

  describe('formatRouteTime', () => {
    it('should format time correctly with hours and minutes', () => {
      const minutes = 125; // 2h 5min
      const formatted = GeocodingService.formatRouteTime(minutes);
      expect(formatted).toBe('2h 5min');
    });

    it('should format time correctly with only minutes', () => {
      const minutes = 45;
      const formatted = GeocodingService.formatRouteTime(minutes);
      expect(formatted).toBe('45 min');
    });
  });
});
