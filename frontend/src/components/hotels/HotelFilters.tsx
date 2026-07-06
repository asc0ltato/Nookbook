import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import type { FiltersState } from "@/types/hotel";

interface HotelFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export const HotelFilters = ({ filters, onFiltersChange }: HotelFiltersProps) => {
  const hotelAmenityOptions = [
    "Wi-Fi",
    "Парковка",
    "Ресторан",
    "Бар",
    "Бассейн",
    "Фитнес-центр",
    "Спа",
    "Трансфер",
    "Прачечная",
    "Доставка еды и напитков в номер",
    "Джакузи"
  ];

  const roomAmenityOptions = [
    "Чайник",
    "Холодильник",
    "Телевизор",
    "Звукоизолированный",
    "Кондиционер",
    "Сейф",
    "Фен",
    "Утюг",
    "Душ",
    "Ванна",
    "Мини-кухня",
    "Вид на озеро",
    "Камин",
    "Сауна",
    "Стиральная машина"
  ];

  const bedTypes = [
    "Односпальная",
    "Двуспальная"
  ];

  const updateFilters = (updates: Partial<FiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handlePriceInputChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (cleanValue === '') {
      const newFilters = { ...filters, [field]: '' };
      if (field === 'minPrice') {
        newFilters.priceRange = [0, filters.priceRange[1]];
      } else {
        newFilters.priceRange = [filters.priceRange[0], 1000];
      }
      updateFilters(newFilters);
      return;
    }
    
    const numValue = parseInt(cleanValue);
    if (numValue < 0) {
      return;
    }
    if (numValue > 1000) {
      return;
    }
    
    const newFilters = { ...filters, [field]: cleanValue };
    
    if (field === 'minPrice') {
      newFilters.priceRange = [numValue, Math.min(filters.priceRange[1], 1000)];
      if (numValue > filters.priceRange[1]) {
        newFilters.priceRange = [numValue, 1000];
        newFilters.maxPrice = '1000';
      }
    } else if (field === 'maxPrice') {
      newFilters.priceRange = [Math.max(filters.priceRange[0], 0), numValue];
      if (numValue < filters.priceRange[0]) {
        newFilters.priceRange = [0, numValue];
        newFilters.minPrice = '0';
      }
    }
    
    updateFilters(newFilters);
  };

  const handleSliderChange = (value: number[]) => {
    const min = Math.max(0, Math.min(1000, value[0] || 0));
    const max = Math.max(0, Math.min(1000, value[1] || 1000));
    updateFilters({
      priceRange: [min, max],
      minPrice: min.toString(),
      maxPrice: max.toString()
    });
  };

  const handleDistanceInputChange = (field: 'minDistance' | 'maxDistance', value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    if (cleanValue === '') {
      const newFilters = { ...filters, [field]: '' };
      if (field === 'minDistance') {
        newFilters.distanceRange = [0, filters.distanceRange[1]];
      } else {
        newFilters.distanceRange = [filters.distanceRange[0], 15];
      }
      updateFilters(newFilters);
      return;
    }
    
    const parsedValue = parseFloat(cleanValue);
    if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 15) return;
    const numValue = Number(parsedValue.toFixed(1));
    
    const newFilters = { ...filters, [field]: cleanValue };
    
    if (field === 'minDistance') {
      newFilters.distanceRange = [numValue, Math.min(filters.distanceRange[1], 15)];
      if (numValue > filters.distanceRange[1]) {
        newFilters.distanceRange = [numValue, 15];
        newFilters.maxDistance = '15';
      }
    } else if (field === 'maxDistance') {
      newFilters.distanceRange = [Math.max(filters.distanceRange[0], 0), numValue];
      if (numValue < filters.distanceRange[0]) {
        newFilters.distanceRange = [0, numValue];
        newFilters.minDistance = '0';
      }
    }
    
    updateFilters(newFilters);
  };

  const handleDistanceSliderChange = (value: number[]) => {
    const min = Math.max(0, Math.min(15, value[0] || 0));
    const max = Math.max(0, Math.min(15, value[1] || 15));
    updateFilters({
      distanceRange: [min, max],
      minDistance: min.toFixed(1),
      maxDistance: max.toFixed(1)
    });
  };

  const getRatingValue = () => {
    return filters.rating.toString();
  };

  const getRatingDisplay = () => {
    const rating = filters.rating;
    if (rating === 0) return "Любой";
    return `${rating}+`;
  };

  const getBedTypeValue = () => {
    return filters.bedType || "any";
  };

  const getBedTypeDisplay = () => {
    const value = getBedTypeValue();
    if (value === "any") return "Любая";
    return value;
  };

  return (
    <div className="w-80 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Цена за сутки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="min-price" className="text-xs text-muted-foreground">От</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => handlePriceInputChange('minPrice', e.target.value)}
                className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
                max={1000}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="max-price" className="text-xs text-muted-foreground">До</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="1000"
                value={filters.maxPrice}
                onChange={(e) => handlePriceInputChange('maxPrice', e.target.value)}
                className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
                max={1000}
              />
            </div>
          </div>
          <Slider
            value={[Math.min(filters.priceRange[0], 1000), Math.min(filters.priceRange[1], 1000)]}
            onValueChange={(value) => {
              handleSliderChange(value as number[]);
            }}
            max={1000}
            step={10}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Рейтинг</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={getRatingValue()} onValueChange={(value) => updateFilters({ rating: Number(value) })}>
            <SelectTrigger>
              <SelectValue>
                {getRatingDisplay()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Любой</SelectItem>
              <SelectItem value="6">6+</SelectItem>
              <SelectItem value="7">7+</SelectItem>
              <SelectItem value="8">8+</SelectItem>
              <SelectItem value="9">9+</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Звезды отеля</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center space-x-2">
                <Checkbox
                  id={`stars-${stars}`}
                  checked={filters.stars.includes(stars)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilters({ stars: [...filters.stars, stars] });
                    } else {
                      updateFilters({ stars: filters.stars.filter(s => s !== stars) });
                    }
                  }}
                />
                <Label htmlFor={`stars-${stars}`} className="text-sm font-normal flex items-center gap-1 cursor-pointer">
                  <div className="flex">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span>{stars}</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Удобства в отеле</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hotelAmenityOptions.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`hotel-${amenity}`}
                  checked={filters.hotelAmenities.includes(amenity)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilters({ hotelAmenities: [...filters.hotelAmenities, amenity] });
                    } else {
                      updateFilters({ hotelAmenities: filters.hotelAmenities.filter(a => a !== amenity) });
                    }
                  }}
                />
                <Label htmlFor={`hotel-${amenity}`} className="text-sm font-normal cursor-pointer">{amenity}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Удобства в номере</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roomAmenityOptions.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`room-${amenity}`}
                  checked={filters.roomAmenities.includes(amenity)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilters({ roomAmenities: [...filters.roomAmenities, amenity] });
                    } else {
                      updateFilters({ roomAmenities: filters.roomAmenities.filter(a => a !== amenity) });
                    }
                  }}
                />
                <Label htmlFor={`room-${amenity}`} className="text-sm font-normal cursor-pointer">{amenity}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Расстояние от центра (км)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="min-distance" className="text-xs text-muted-foreground">От</Label>
              <Input
                id="min-distance"
                type="number"
                placeholder="0"
                value={filters.minDistance}
                onChange={(e) => handleDistanceInputChange('minDistance', e.target.value)}
                className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
                max={15}
                step={0.1}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="max-distance" className="text-xs text-muted-foreground">До</Label>
              <Input
                id="max-distance"
                type="number"
                placeholder="15"
                value={filters.maxDistance}
                onChange={(e) => handleDistanceInputChange('maxDistance', e.target.value)}
                className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
                max={15}
                step={0.1}
              />
            </div>
          </div>
          <Slider
            value={[Math.min(filters.distanceRange[0], 15), Math.min(filters.distanceRange[1], 15)]}
            onValueChange={(value) => {
              handleDistanceSliderChange(value as number[]);
            }}
            max={15}
            step={0.1}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тип кровати</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={getBedTypeValue()} onValueChange={(value) => updateFilters({ bedType: value })}>
            <SelectTrigger>
              <SelectValue>
                {getBedTypeDisplay()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Любая</SelectItem>
              {bedTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};