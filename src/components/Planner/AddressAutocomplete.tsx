import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDawaAutocomplete } from '@/hooks/useDawaAutocomplete';
import { useTranslation } from '@/context/TranslationContext';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  value: string;
  onChange: (location: string) => void;
  onAddressSelect: (data: { address: string; zipCode: string; city: string }) => void;
  placeholder?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const { suggestions, isLoading } = useDawaAutocomplete(inputValue);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(val.trim().length >= 2);
  };

  const handleSelect = (suggestion: typeof suggestions[0]) => {
    const addr = suggestion.adresse;
    const fullAddress = `${addr.vejnavn} ${addr.husnr}, ${addr.postnr} ${addr.postnrnavn}`.trim();
    setInputValue(fullAddress);
    onChange(fullAddress);
    onAddressSelect({
      address: fullAddress,
      zipCode: addr.postnr,
      city: addr.postnrnavn,
    });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.trim().length >= 2 && suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder || t('planner.addressSearch')}
          required
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border-2 border-border bg-popover shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                i > 0 && "border-t border-border/50"
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{s.tekst}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && inputValue.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border-2 border-border bg-popover shadow-lg px-3 py-2.5 text-sm text-muted-foreground">
          {t('planner.addressNotFound')}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
