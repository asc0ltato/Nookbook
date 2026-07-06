import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface HotelSortProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

const sortOptions: { [key: string]: string } = {
  "popular": "Популярные",
  "price-low": "Сначала дешевые",
  "price-high": "Сначала дорогие",
  "rating": "Высокий рейтинг"
};

export const HotelSort = ({ sortBy, onSortChange }: HotelSortProps) => {
  const currentSortBy = sortBy || "popular";
  const currentSortLabel = sortOptions[currentSortBy] || sortOptions.popular;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">Сортировка:</span>
      <Select value={currentSortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-56">
          <span>{currentSortLabel}</span>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(sortOptions).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
