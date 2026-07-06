"use client";

import { Info, Search, BadgePercent, Wallet, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Advantage {
  title: string;
  description: string;
  Icon: LucideIcon;
}

const advantages: Advantage[] = [
  {
    title: "Персональные рекомендации",
    description: "Умные рекомендации на основе вашей истории поиска и предпочтений",
    Icon: Info,
  },
  {
    title: "Популярные направления",
    description: "Откройте для себя самые популярные города и отели Беларуси",
    Icon: Search,
  },
  {
    title: "Похожие отели",
    description: "Альтернативные варианты с похожими характеристиками и расположением",
    Icon: BadgePercent,
  },
  {
    title: "Бронирование без предоплаты",
    description: "Забронируйте номер без предоплаты и оплатите при заселении в отель",
    Icon: Wallet,
  },
  {
    title: "Безопасное бронирование",
    description: "Ваши данные защищены, а бронирование подтверждается мгновенно",
    Icon: ShieldCheck,
  },
];

interface BookingAdvantagesProps {
  compact?: boolean;
}

export const BookingAdvantages = ({ compact = false }: BookingAdvantagesProps) => {
  return (
    <section className={compact ? "py-2" : "py-12 animate-fade-in-up animation-delay-1000"}>
      {!compact && (
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            <span>Почему выбирают NookBook?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Мы делаем бронирование отелей простым и удобным
          </p>
        </div>
      )}

      {compact && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="h-px w-5 bg-gradient-to-r from-transparent to-yellow-400" />
            <h3 className="text-base font-bold text-foreground tracking-wide">
              <span>Наши преимущества</span>
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-yellow-400 to-transparent" />
          </div>
        </div>
      )}

      <div className={`grid ${compact ? "grid-cols-2 sm:grid-cols-5 gap-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"}`}>
        {advantages.map((advantage, index) => {
          const Icon = advantage.Icon;
          return (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-lg border border-border bg-card/80 backdrop-blur-sm 
                transition-all duration-500 hover:scale-[1.02] hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10
                ${compact ? "min-h-[160px]" : "min-h-[280px]"}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 via-transparent to-orange-400/0 
                group-hover:from-yellow-400/5 group-hover:via-yellow-400/2 group-hover:to-orange-400/5 
                transition-all duration-700"
              />

              <div
                className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-400/10 to-transparent 
                rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />

              <div className={`relative ${compact ? "p-3" : "p-6"} h-full flex flex-col items-center justify-center text-center`}>
                <div className={`relative ${compact ? "mb-2" : "mb-6"}`}>
                  <div
                    className={`${compact ? "w-10 h-10" : "w-20 h-20"} ${compact ? "rounded-lg" : "rounded-2xl"} bg-gradient-to-br from-yellow-400/20 to-orange-400/20 
                    flex items-center justify-center border border-yellow-400/20 group-hover:border-yellow-400/40
                    group-hover:from-yellow-400/30 group-hover:to-orange-400/30 transition-all duration-500`}
                  >
                    <div className={`absolute inset-0 ${compact ? "rounded-lg" : "rounded-2xl"} border border-yellow-400/10`} />
                    <Icon
                      className={`${compact ? "w-5 h-5" : "w-10 h-10"} text-yellow-400 group-hover:scale-110 transition-transform duration-300`}
                      strokeWidth={1.75}
                    />
                  </div>
                </div>

                <h3
                  className={`${compact ? "text-sm leading-tight" : "text-lg mb-3"} font-bold text-foreground group-hover:text-primary transition-colors duration-300`}
                >
                  {advantage.title}
                </h3>
                {!compact && (
                  <div
                    className="h-0.5 w-8 bg-gradient-to-r from-yellow-400/50 to-orange-400/50 rounded-full 
                    mb-3 group-hover:w-12 group-hover:from-yellow-400 group-hover:to-orange-400 transition-all duration-300"
                  />
                )}

                {!compact && (
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{advantage.description}</p>
                )}
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent 
                opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
