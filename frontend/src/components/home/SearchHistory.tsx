import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface SearchHistoryItem {
  id: string;
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  timestamp: number;
}

const cityToSlug: { [key: string]: string } = {
  "Минск": "minsk",
  "Брест": "brest",
  "Витебск": "vitebsk", 
  "Гомель": "gomel",
  "Гродно": "grodno",
  "Могилев": "mogilev"
};

const ITEMS_PER_PAGE = 4;

export const SearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const now = new Date();
      const validHistory = history.filter((item: any) => {
        if (!item ||
            typeof item.id !== 'string' ||
            typeof item.city !== 'string' ||
            typeof item.timestamp !== 'number') {
          return false;
        }

        if (item.checkIn) {
          const checkInDate = new Date(item.checkIn);
          if (checkInDate < now) {
            return false;
          }
        }

        return true;
      });

      localStorage.setItem('searchHistory', JSON.stringify(validHistory));
      setSearchHistory(validHistory);
    } catch (error) {
      console.error('Error loading search history:', error);
      setSearchHistory([]);
    }
  }, []);

  const handleHistoryClick = (item: SearchHistoryItem) => {
    const slug = cityToSlug[item.city] || item.city.toLowerCase();
    router.push(`/hotels/${slug}`);
  };

  const formatGuests = (adults: number, children: number) => {
    const total = adults + children;
    return `${total} ${total === 1 ? 'гость' : total < 5 ? 'гостя' : 'гостей'}`;
  };

  const formatDateRange = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) {
      return "Любые даты";
    }
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      return `${format(checkInDate, 'd MMM', { locale: ru })} - ${format(checkOutDate, 'd MMM', { locale: ru })}`;
    } catch {
      return "Любые даты";
    }
  };

  if (searchHistory.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(searchHistory.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const currentItems = searchHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-foreground tracking-wide">
          История поиска
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0 text-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0 text-foreground hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {currentItems.map((item) => {
          if (!item || !item.id || !item.city) {
            return null;
          }
          
          return (
            <Card 
              key={item.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-border bg-card/80 backdrop-blur-sm group"
              onClick={() => handleHistoryClick(item)}
            >
              <CardContent className="p-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="font-bold text-foreground text-sm group-hover:text-primary transition-colors tracking-wide">
                      {item.city}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground/80">
                      {formatDateRange(item.checkIn || '', item.checkOut || '')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-foreground/80">
                      {formatGuests(item.adults || 2, item.children || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

