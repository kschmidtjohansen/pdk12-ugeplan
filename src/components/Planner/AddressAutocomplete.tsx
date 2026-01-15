import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/TranslationContext';
import { Car, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder,
  required = false
}) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('[AddressAutocomplete] Got user location:', position.coords);
        },
        (error) => {
          console.log('[AddressAutocomplete] Could not get user location:', error.message);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search addresses via Nominatim
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query)}&countrycodes=dk&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'da',
            'User-Agent': 'PDK12-Ugeplan/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: NominatimSuggestion[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('[AddressAutocomplete] Search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Calculate driving route via OSRM
  const calculateRoute = useCallback(async (destLat: number, destLon: number): Promise<RouteInfo | null> => {
    if (!userLocation) return null;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${userLocation.lng},${userLocation.lat};${destLon},${destLat}?overview=false`
      );

      if (!response.ok) throw new Error('Route calculation failed');

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return {
          distance: Math.round(data.routes[0].distance / 100) / 10, // meters to km, 1 decimal
          duration: Math.round(data.routes[0].duration / 60) // seconds to minutes
        };
      }
      return null;
    } catch (error) {
      console.error('[AddressAutocomplete] Route calculation error:', error);
      return null;
    }
  }, [userLocation]);

  // Handle input change with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setRouteInfo(null);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  }, [onChange, searchAddresses]);

  // Handle suggestion selection
  const handleSelect = useCallback(async (suggestion: NominatimSuggestion) => {
    onChange(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);

    if (userLocation) {
      setIsCalculatingRoute(true);
      const route = await calculateRoute(
        parseFloat(suggestion.lat),
        parseFloat(suggestion.lon)
      );
      setRouteInfo(route);
      setIsCalculatingRoute(false);
    }
  }, [onChange, userLocation, calculateRoute]);

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} t ${mins} min` : `${hours} t`;
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="relative">
        <Input
          id="location"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="pr-8"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "px-3 py-2 hover:bg-accent cursor-pointer text-sm",
                "flex items-start gap-2 border-b last:border-b-0"
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{suggestion.display_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Route info */}
      {isCalculatingRoute && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t('planner.calculatingRoute')}
        </p>
      )}

      {routeInfo && !isCalculatingRoute && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5" />
          {t('planner.routeDistance')
            .replace('{distance}', routeInfo.distance.toString())
            .replace('{duration}', formatDuration(routeInfo.duration))}
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
