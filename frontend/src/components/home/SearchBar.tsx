"use client";

import { useState } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "./DateRangePicker";

const cities = ["Минск", "Брест", "Витебск", "Гомель", "Гродно", "Могилев"];

const cityToSlug: { [key: string]: string } = {
  "Минск": "minsk",
  "Брест": "brest",
  "Витебск": "vitebsk", 
  "Гомель": "gomel",
  "Гродно": "grodno",
  "Могилев": "mogilev"
};

const slugToCity: { [key: string]: string } = {
  "minsk": "Минск",
  "brest": "Брест",
  "vitebsk": "Витебск",
  "gomel": "Гомель", 
  "grodno": "Гродно",
  "mogilev": "Могилев"
};

interface SearchBarProps {
  prefillCity?: string;
}

export const SearchBar = ({ prefillCity }: SearchBarProps) => {
  const router = useRouter();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [selectedCity, setSelectedCity] = useState<string>(
    prefillCity ? slugToCity[prefillCity] : ""
  );
  const [checkIn, setCheckIn] = useState<Date | undefined>(today);
  const [checkOut, setCheckOut] = useState<Date | undefined>(tomorrow);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");
  const [checkInPopoverOpen, setCheckInPopoverOpen] = useState(false);
  const [checkOutPopoverOpen, setCheckOutPopoverOpen] = useState(false);
  const [guestsPopoverOpen, setGuestsPopoverOpen] = useState(false);
  
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>([]);
  const [pets, setPets] = useState(false);

  const formatAge = (age: number | null): string => {
    if (age === null || age === undefined) return "Выберите";
    if (age === 0) return "до года";
    if (age === 1) return "1 год";
    if (age >= 2 && age <= 4) return `${age} года`;
    return `${age} лет`;
  };
  
  const ageOptions = Array.from({ length: 18 }, (_, i) => ({
    value: i.toString(),
    label: formatAge(i)
  }));

  const handleSearch = async () => {
    if (!selectedCity) {
      return;
    }

    const citySlug = cityToSlug[selectedCity];
    
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const newSearch = {
        id: `${citySlug}-${Date.now()}`,
        city: selectedCity,
        checkIn: checkIn?.toISOString() || '',
        checkOut: checkOut?.toISOString() || '',
        adults,
        children,
        childrenAges: childrenAges.map(age => age ?? 0),
        pets,
        timestamp: Date.now()
      };
      
      const updatedHistory = [newSearch, ...history.slice(0, 4)];
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }

    router.push(`/hotels/${citySlug}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Куда едем
            </label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger 
                className="bg-background border-border text-foreground font-sans font-medium h-12 text-base hover:bg-muted/80 focus:ring-2 focus:ring-yellow-400 transition-all"
                onKeyDown={handleKeyPress}
              >
                <SelectValue placeholder={selectedCity || "Выберите город"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {cities.map((city) => (
                  <SelectItem 
                    key={city} 
                    value={city}
                    className="text-base py-3 cursor-pointer hover:bg-accent focus:bg-accent"
                  >
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Заезд
            </label>
            <Popover open={checkInPopoverOpen} onOpenChange={setCheckInPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-medium bg-background border-border text-foreground h-12 text-base hover:bg-muted/80 focus:ring-2 focus:ring-yellow-400 transition-all"
                  onKeyDown={handleKeyPress}
                  onClick={() => {
                    setDatePickerMode("checkin");
                    setCheckOutPopoverOpen(false);
                  }}
                >
                  {checkIn ? (
                    format(checkIn, "d MMM yyyy", { locale: ru })
                  ) : (
                    <span className="text-muted-foreground">Когда</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border max-h-[80vh] overflow-hidden" align="start">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onCheckInChange={(date) => {
                    setCheckIn(date);
                  }}
                  onCheckOutChange={(date) => {
                    setCheckOut(date);
                  }}
                  mode={datePickerMode}
                  onModeChange={(mode) => {
                    setDatePickerMode(mode);
                    if (mode === "checkout") {
                      setCheckInPopoverOpen(false);
                      setCheckOutPopoverOpen(true);
                    }
                  }}
                  onClose={() => setCheckInPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Выезд
            </label>
            <Popover open={checkOutPopoverOpen} onOpenChange={setCheckOutPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-medium bg-background border-border text-foreground h-12 text-base hover:bg-muted/80 focus:ring-2 focus:ring-yellow-400 transition-all"
                  onKeyDown={handleKeyPress}
                  onClick={() => {
                    setDatePickerMode("checkout");
                    setCheckInPopoverOpen(false);
                  }}
                >
                  {checkOut ? (
                    format(checkOut, "d MMM yyyy", { locale: ru })
                  ) : (
                    <span className="text-muted-foreground">Когда</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border max-h-[80vh] overflow-hidden" align="start">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onCheckInChange={(date) => {
                    setCheckIn(date);
                    if (date && checkOut && date >= checkOut) {
                      setCheckOut(undefined);
                    }
                  }}
                  onCheckOutChange={(date) => {
                    setCheckOut(date);
                  }}
                  mode={datePickerMode}
                  onModeChange={(mode) => {
                    setDatePickerMode(mode);
                    if (mode === "checkin") {
                      setCheckOutPopoverOpen(false);
                      setCheckInPopoverOpen(true);
                    }
                  }}
                  onClose={() => setCheckOutPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Гости
            </label>
            <Popover open={guestsPopoverOpen} onOpenChange={setGuestsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-medium bg-background border-border text-foreground h-12 text-base hover:bg-muted/80 focus:ring-2 focus:ring-yellow-400 transition-all truncate"
                  onKeyDown={handleKeyPress}
                >
                  <span className="truncate">
                    {(() => {
                      let parts = [];
                      parts.push(`${adults} ${adults === 1 ? 'взрослый' : adults < 5 ? 'взрослых' : 'взрослых'}`);
                      if (children > 0) {
                        parts.push(`${children} ${children === 1 ? 'ребенок' : children < 5 ? 'ребенка' : 'детей'}`);
                      }
                      if (pets) {
                        parts.push('питомец');
                      }
                      return parts.join(', ');
                    })()}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-popover border-border z-[80]" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Взрослые</div>
                      <div className="text-sm text-muted-foreground">От 18 лет</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="h-8 w-8"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAdults(Math.min(20, adults + 1))}
                        className="h-8 w-8"
                        disabled={adults >= 20}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Дети</div>
                      <div className="text-sm text-muted-foreground">До 17 лет</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newChildren = Math.max(0, children - 1);
                          setChildren(newChildren);
                          setChildrenAges(childrenAges.slice(0, newChildren));
                        }}
                        className="h-8 w-8"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (children < 10) {
                            setChildren(children + 1);
                            setChildrenAges([...childrenAges, null]);
                          }
                        }}
                        className="h-8 w-8"
                        disabled={children >= 10}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {children > 0 && (
                    <div className="space-y-3">
                      {childrenAges.map((age, index) => (
                        <div key={index} className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Возраст</label>
                          <Select
                            value={age !== null && age !== undefined ? age.toString() : ""}
                            onValueChange={(value) => {
                              const newAges = [...childrenAges];
                              newAges[index] = value === "" ? null : parseInt(value);
                              setChildrenAges(newAges);
                            }}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder="Выберите">
                                {age !== null && age !== undefined 
                                  ? ageOptions.find(opt => opt.value === age.toString())?.label || formatAge(age)
                                  : "Выберите"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="z-[100]">
                              {ageOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <div className="font-medium">С питомцами</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPets(!pets)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        pets ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pets ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-black hover:bg-gray-900 text-white"
                    onClick={() => {
                      setGuestsPopoverOpen(false);
                    }}
                  >
                    Готово
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground opacity-0 pointer-events-none">
              Поиск
            </label>
            <Button 
              onClick={handleSearch}
              disabled={!selectedCity || (children > 0 && childrenAges.some(age => age === null || age === undefined))}
              className="w-full h-12 text-base font-bold bg-yellow-500 hover:bg-yellow-600 text-black shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Найти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

