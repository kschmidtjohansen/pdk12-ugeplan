import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudRain, X, Plus } from 'lucide-react';
import { useDepartment } from '@/context/DepartmentContext';
import { useToast } from '@/hooks/use-toast';
import {
  useWeatherAlertSettings,
  usePostalCodeCoordinates,
  DEFAULT_WEATHER_ALERT_SETTINGS,
} from '@/hooks/useWeatherAlertSettings';

const WeatherAlertSettings: React.FC = () => {
  const { selectedDepartmentId } = useDepartment();
  const { toast } = useToast();
  const { settings, isLoading, save, isSaving } = useWeatherAlertSettings(selectedDepartmentId);

  const [enabled, setEnabled] = useState(DEFAULT_WEATHER_ALERT_SETTINGS.enabled);
  const [postalCodes, setPostalCodes] = useState<string[]>([]);
  const [rain24, setRain24] = useState(String(DEFAULT_WEATHER_ALERT_SETTINGS.rain24hMm));
  const [rain30, setRain30] = useState(String(DEFAULT_WEATHER_ALERT_SETTINGS.rain30minMm));
  const [gust, setGust] = useState(String(DEFAULT_WEATHER_ALERT_SETTINGS.gustMs));
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    if (isLoading) return;
    setEnabled(settings.enabled);
    setPostalCodes(settings.postalCodes);
    setRain24(String(settings.rain24hMm));
    setRain30(String(settings.rain30minMm));
    setGust(String(settings.gustMs));
  }, [isLoading, settings]);

  const { data: resolved } = usePostalCodeCoordinates(postalCodes);
  const resolvedMap = new Map((resolved ?? []).map(p => [p.nr, p.navn]));

  const addCode = () => {
    const code = newCode.trim();
    if (!/^\d{4}$/.test(code)) {
      toast({
        title: 'Ugyldigt postnummer',
        description: 'Skriv et dansk postnummer på 4 cifre.',
        variant: 'destructive',
      });
      return;
    }
    if (!postalCodes.includes(code)) setPostalCodes([...postalCodes, code].sort());
    setNewCode('');
  };

  const handleSave = async () => {
    const rain24hMm = Math.max(1, Math.min(200, parseInt(rain24, 10) || DEFAULT_WEATHER_ALERT_SETTINGS.rain24hMm));
    const rain30minMm = Math.max(1, Math.min(100, parseInt(rain30, 10) || DEFAULT_WEATHER_ALERT_SETTINGS.rain30minMm));
    const gustMs = Math.max(5, Math.min(60, parseFloat(gust.replace(',', '.')) || DEFAULT_WEATHER_ALERT_SETTINGS.gustMs);
    try {
      await save({ enabled, postalCodes, rain24hMm, rain30minMm, gustMs });
      setRain24(String(rain24hMm));
      setRain30(String(rain30minMm));
      setGust(String(gustMs));
      toast({ title: 'Gemt', description: 'Indstillinger for vejrvarsel er opdateret.' });
    } catch (error) {
      toast({
        title: 'Kunne ikke gemme',
        description: (error as { message?: string })?.message ?? 'Prøv igen.',
        variant: 'destructive',
      });
    }
  };

  const summary = enabled
    ? `Bjælken vises ved mindst ${rain24 || '—'} mm regn på 24 timer, ${rain30 || '—'} mm på 30 min eller vindstød over ${gust || '—'} m/s${
        postalCodes.length ? ` i ${postalCodes.join(', ')}` : ' i afdelingens opgaveområde'
      }.`
    : 'Beredskabsbjælken er slået fra for denne afdeling.';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudRain className="h-4 w-4" />
          Vejrvarsel (beredskab)
        </CardTitle>
        <CardDescription>
          Bestem hvilke postnumre og grænseværdier der udløser beredskabsbjælken på forsiden.
          Standardgrænserne følger forsikringens dækningsgrænser (Forsikringsvejret): storm ved
          vindstød ≥ 17,2 m/s, skybrud ved ≥ 30 mm regn på 24 timer og kraftig regn ved ≥ 15 mm på 30 min.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="weather-enabled">Vis beredskabsbjælke</Label>
            <p className="text-sm text-muted-foreground">Kun synlig for skadeledere og administratorer.</p>
          </div>
          <Switch id="weather-enabled" checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weather-postal">Postnumre i dækningsområdet</Label>
          <div className="flex gap-2">
            <Input
              id="weather-postal"
              value={newCode}
              inputMode="numeric"
              maxLength={4}
              placeholder="fx 2600"
              className="h-11 w-32"
              onChange={e => setNewCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCode();
                }
              }}
            />
            <Button type="button" variant="outline" className="min-h-11" onClick={addCode}>
              <Plus className="mr-1 h-4 w-4" />
              Tilføj
            </Button>
          </div>
          {postalCodes.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {postalCodes.map(code => (
                <Badge key={code} variant="secondary" className="gap-1 py-1 pl-2 pr-1">
                  {code}
                  {resolvedMap.get(code) && (
                    <span className="text-muted-foreground">{resolvedMap.get(code)}</span>
                  )}
                  <button
                    type="button"
                    aria-label={`Fjern ${code}`}
                    className="rounded p-1 hover:bg-muted"
                    onClick={() => setPostalCodes(postalCodes.filter(c => c !== code))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Uden postnumre bruges placeringen af afdelingens opgaver.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="weather-rain24">Regn pr. 24 timer (mm)</Label>
            <Input
              id="weather-rain24"
              type="number"
              min={1}
              max={200}
              inputMode="numeric"
              value={rain24}
              className="h-11"
              onChange={e => setRain24(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Skybrudsdækning typisk fra 30 mm.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weather-rain30">Kraftig regn pr. 30 min (mm)</Label>
            <Input
              id="weather-rain30"
              type="number"
              min={1}
              max={100}
              inputMode="numeric"
              value={rain30}
              className="h-11"
              onChange={e => setRain30(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Forsikringens grænse: 15 mm.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weather-gust">Vindstød (m/s)</Label>
            <Input
              id="weather-gust"
              type="number"
              min={5}
              max={60}
              step="0.1"
              inputMode="decimal"
              value={gust}
              className="h-11"
              onChange={e => setGust(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Stormdækning fra 17,2 m/s.</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{summary}</p>

        <Button onClick={handleSave} disabled={isSaving || !selectedDepartmentId} className="min-h-11">
          {isSaving ? 'Gemmer…' : 'Gem indstillinger'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WeatherAlertSettings;
