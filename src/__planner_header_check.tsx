import React from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Monitor, LayoutGrid, LayoutList, List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import '@/index.css';

/** Filter row replica: same markup/classes as PlannerFilterBar's top row + result count. */
const Filters = () => (
  <div className="relative space-y-2">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 pl-9 pr-12" placeholder="Søg i opgaver..." />
      </div>
      <Button variant="outline" size="sm" className="min-h-11">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Vis filtre
      </Button>
    </div>
    <p className="text-xs text-muted-foreground tabular-nums">Viser 12 af 20 opgaver</p>
  </div>
);

const Title = () => (
  <div className="min-w-0">
    <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">Ugeplan</h1>
    <p className="text-sm text-muted-foreground truncate">Uge 44 · 2026 — man 26 okt – søn 1 nov</p>
  </div>
);

const Toggles = () => (
  <div className="flex items-center justify-center sm:justify-start pt-1.5">
    <ToggleGroup type="single" value="standard" className="bg-muted/50 border border-border rounded-lg p-0.5">
      <ToggleGroupItem value="standard" size="sm" className="h-8 w-8 min-h-0 min-w-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
        <List className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" size="sm" className="h-8 w-8 min-h-0 min-w-0 p-0">
        <LayoutGrid className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" size="sm" className="h-8 w-8 min-h-0 min-w-0 p-0">
        <LayoutList className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="calendar" size="sm" className="h-8 w-8 min-h-0 min-w-0 p-0">
        <CalendarDays className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
);

const NewTask = () => (
  <Button className="min-h-11"><Plus className="h-4 w-4" />Ny Opgave</Button>
);

const Before = () => (
  <header data-variant="before" className="space-y-3 border-b border-border pb-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0"><Title /></div>
      <NewTask />
    </div>
    <div className="flex flex-wrap items-start gap-3">
      <Toggles />
      <div className="min-w-0 flex-1"><Filters /></div>
    </div>
  </header>
);

const After = () => (
  <header data-variant="after" className="space-y-2 border-b border-border pb-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><Title /></div>
    <div className="flex flex-wrap items-start gap-3">
      <Toggles />
      <div className="min-w-0 flex-1"><Filters /></div>
      <Button className="min-h-11 shrink-0 self-end"><Plus className="h-4 w-4" />Ny Opgave</Button>
    </div>
  </header>
);

createRoot(document.getElementById('root')!).render(
  <div className="min-h-dvh w-full bg-background text-foreground">
    <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5 space-y-3 sm:space-y-4">
      <Before />
      <After />
    </div>
  </div>
);
