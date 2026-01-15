import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onRouteInfoChange?: (info: RouteInfo | null) => void;
  placeholder?: string;
  required?: boolean;
}

// Fast depot-adresse: Industrivej 10, 7000 Fredericia
const DEPOT_LOCATION = {
  lat: 55.5657,
  lng: 9.7525,
  address: 'Industrivej 10, 7000 Fredericia'
};

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onRouteInfoChange,
  placeholder,
  required = false
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local state with parent value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Update input rect for portal positioning
  const updateInputRect = useCallback(() => {
    if (inputRef.current) {
      setInputRect(inputRef.current.getBoundingClientRect());
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    const handleScroll = () => {
      updateInputRect();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updateInputRect);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateInputRect);
    };
  }, [updateInputRect]);

  // Search addresses via Nominatim
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);
    updateInputRect();
    
    try {
      console.log('[AddressAutocomplete] Searching for:', query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=dk&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'da'
        }
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: NominatimSuggestion[] = await response.json();
      console.log('[AddressAutocomplete] Got suggestions:', data.length);
      setSuggestions(data);
    } catch (error) {
      console.error('[AddressAutocomplete] Search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [updateInputRect]);

  // Calculate driving route via OSRM from depot
  const calculateRoute = useCallback(async (destLat: number, destLon: number): Promise<RouteInfo | null> => {
    try {
      console.log('[AddressAutocomplete] Calculating route from depot to:', destLat, destLon);
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/` +
        `${DEPOT_LOCATION.lng},${DEPOT_LOCATION.lat};${destLon},${destLat}?overview=false`
      );

      if (!response.ok) throw new Error('Route calculation failed');

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const info: RouteInfo = {
          distanceKm: Math.round(data.routes[0].distance / 100) / 10, // meters to km, 1 decimal
          durationMin: Math.round(data.routes[0].duration / 60) // seconds to minutes
        };
        console.log('[AddressAutocomplete] Route calculated:', info);
        return info;
      }
      return null;
    } catch (error) {
      console.error('[AddressAutocomplete] Route calculation error:', error);
      return null;
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('[AddressAutocomplete] Input changed to:', newValue);
    setInputValue(newValue);
    onChange(newValue);
    setRouteInfo(null);
    onRouteInfoChange?.(null);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  }, [onChange, onRouteInfoChange, searchAddresses]);

  // Handle suggestion selection
  const handleSelect = useCallback(async (suggestion: NominatimSuggestion) => {
    const newValue = suggestion.display_name;
    setInputValue(newValue);
    onChange(newValue);
    setSuggestions([]);
    setShowSuggestions(false);

    setIsCalculatingRoute(true);
    const route = await calculateRoute(
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon)
    );
    setRouteInfo(route);
    onRouteInfoChange?.(route);
    setIsCalculatingRoute(false);
  }, [onChange, onRouteInfoChange, calculateRoute]);

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} t ${mins} min` : `${hours} t`;
  };

  // Suggestions dropdown rendered via Portal
  const suggestionsDropdown = showSuggestions && (suggestions.length > 0 || isSearching) && inputRect && createPortal(
    <div 
      className="fixed z-[99999] bg-white dark:bg-gray-900 border-2 border-primary/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
      style={{ 
        top: inputRect.bottom + window.scrollY + 4,
        left: inputRect.left + window.scrollX,
        width: inputRect.width,
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
    >
      {isSearching && (
        <div className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Søger...
        </div>
      )}
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.place_id}
          onClick={() => handleSelect(suggestion)}
          className={cn(
            "px-3 py-3 hover:bg-accent cursor-pointer text-sm",
            "flex items-start gap-2 border-b last:border-b-0 border-border",
            "transition-colors bg-background"
          )}
        >
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
          <span className="line-clamp-2 text-foreground">{suggestion.display_name}</span>
        </div>
      ))}
    </div>,
    document.body
  );

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="relative">
        <Input
          ref={inputRef}
          id="location"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            updateInputRect();
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            } else if (inputValue.length >= 3) {
              // Search on existing value in edit mode
              searchAddresses(inputValue);
            }
          }}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          className="pr-8"
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {suggestionsDropdown}

      {/* Route info */}
      {isCalculatingRoute && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t('planner.calculatingRoute')}
        </p>
      )}

      {routeInfo && !isCalculatingRoute && (
        <p className="text-sm text-primary flex items-center gap-1.5 font-medium">
          <Car className="h-3.5 w-3.5" />
          {routeInfo.distanceKm} km · ca. {formatDuration(routeInfo.durationMin)} kørsel fra depot
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
