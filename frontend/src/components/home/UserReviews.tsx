import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  city: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Анна Петрова",
    avatar: "AP",
    rating: 5,
    comment: "Отличный сервис! Быстро нашла подходящий отель в Минске. Бронирование прошло без проблем, цены действительно выгодные.",
    date: "15 января 2024",
    city: "Минск"
  },
  {
    id: 2,
    name: "Дмитрий Иванов",
    avatar: "ДИ",
    rating: 5,
    comment: "Пользуюсь NookBook уже несколько месяцев. Очень удобный поиск, всегда актуальная информация об отелях. Рекомендую!",
    date: "10 января 2024",
    city: "Брест"
  },
  {
    id: 3,
    name: "Елена Смирнова",
    avatar: "ЕС",
    rating: 4,
    comment: "Хороший сайт для бронирования отелей в Беларуси. Понравилась возможность бронирования без предоплаты. Буду пользоваться еще!",
    date: "8 января 2024",
    city: "Гродно"
  },
  {
    id: 4,
    name: "Максим Козлов",
    avatar: "МК",
    rating: 5,
    comment: "Забронировал отель для командировки через NookBook. Все просто и понятно, поддержка быстро ответила на вопросы. Спасибо!",
    date: "5 января 2024",
    city: "Витебск"
  },
  {
    id: 5,
    name: "Ольга Николаева",
    avatar: "ОН",
    rating: 5,
    comment: "Замечательный сервис! Нашла отличный вариант для семейного отдыха. Цены ниже, чем на других сайтах. Очень довольна!",
    date: "2 января 2024",
    city: "Гомель"
  }
];

export const UserReviews = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    (currentIndex + 1) * reviewsPerPage
  );

  const nextReview = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevReview = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
        }`}
      />
    ));
  };

  return (
    <section className="py-8 animate-fade-in-up animation-delay-1100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
              Отзывы пользователей
            </span>
          </h2>
          <p className="text-lg text-gray-300 font-medium">
            Что говорят наши клиенты о сервисе
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevReview}
            disabled={currentIndex === 0}
            className="h-10 w-10 p-0 text-foreground hover:bg-muted disabled:opacity-30 border border-border"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-gray-300 px-3 font-medium">
            {currentIndex + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextReview}
            disabled={currentIndex === totalPages - 1}
            className="h-10 w-10 p-0 text-foreground hover:bg-muted disabled:opacity-30 border border-border"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentReviews.map((review) => (
          <Card
            key={review.id}
            className="group relative overflow-hidden border border-border bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-400/30 flex items-center justify-center font-bold text-white text-sm">
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-foreground text-sm">{review.name}</h4>
                  <p className="text-xs text-gray-400">{review.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
              </div>

              <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                {review.comment}
              </p>

              <p className="text-xs text-gray-400 pt-2 border-t border-white/10">
                {review.date}
              </p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-orange-400/0 to-pink-400/0 group-hover:from-yellow-400/5 group-hover:via-orange-400/5 group-hover:to-pink-400/5 transition-all duration-500 pointer-events-none" />
          </Card>
        ))}
      </div>
    </section>
  );
};

