
import React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Car } from "@/types/car";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/TranslationContext";
import { Badge } from "@/components/ui/badge";

interface CarSelectorProps {
  cars: Car[];
  selectedCar?: string;
  onCarSelect: (value: string | undefined) => void;
}

const CarSelector: React.FC<CarSelectorProps> = ({
  cars,
  selectedCar,
  onCarSelect,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const selectedCarInfo = selectedCar
    ? cars.find((car) => car.id === selectedCar)
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCarInfo ? (
            <span>
              {selectedCarInfo.name} ({selectedCarInfo.number_plate})
            </span>
          ) : (
            t("planner.selectCar")
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t("planner.searchCars")} />
          <CommandEmpty>{t("planner.noCarsFound")}</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-auto">
            {cars.map((car) => (
              <CommandItem
                key={car.id}
                value={car.id}
                onSelect={() => {
                  onCarSelect(car.id === selectedCar ? undefined : car.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCar === car.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{car.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {car.number_plate}
                  </span>
                </div>
                {car.has_trailer_hitch && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-blue-50 text-blue-600 border-blue-200"
                  >
                    {t("planner.hasTrailerHitch")}
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CarSelector;
