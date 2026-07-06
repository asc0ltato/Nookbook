import { StaticPage } from "@/components/shared/StaticPage";

export default function AboutPage() {
  return (
    <StaticPage>
        <h1 className="text-4xl font-bold mb-8">О сервисе NookBook</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Кто мы</h2>
            <p className="text-muted-foreground leading-relaxed">
              NookBook — современный сервис бронирования отелей в Беларуси. Мы создали удобную платформу, 
              которая помогает путешественникам находить и бронировать идеальное жилье в любом городе страны.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Наша миссия</h2>
            <p className="text-muted-foreground leading-relaxed">
              Мы стремимся сделать процесс поиска и бронирования отелей максимально простым и прозрачным. 
              Наша цель — предоставить путешественникам полную информацию об отелях, честные отзывы 
              и лучшие цены на рынке.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Что мы предлагаем</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Широкий выбор отелей во всех крупных городах Беларуси</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Удобный поиск с фильтрами по цене, рейтингу и удобствам</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Детальные описания номеров с фотографиями</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Реальные отзывы гостей</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Безопасное бронирование без предоплаты</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Поддержка клиентов 24/7</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Почему выбирают нас</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-primary">Прозрачность</h3>
                <p className="text-muted-foreground text-sm">
                  Никаких скрытых платежей. Все цены указаны окончательно с учетом всех налогов и сборов.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-primary">Надежность</h3>
                <p className="text-muted-foreground text-sm">
                  Работаем только с проверенными отелями. Гарантируем безопасность ваших данных.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-primary">Удобство</h3>
                <p className="text-muted-foreground text-sm">
                  Простой и понятный интерфейс. Бронирование за пару кликов с любого устройства.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2 text-primary">Поддержка</h3>
                <p className="text-muted-foreground text-sm">
                  Наша команда всегда готова помочь вам с любыми вопросами по бронированию.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Контакты</h2>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Email:</strong> support@nookbook.by
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Телефон:</strong> +375 29 123-45-67
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Время работы:</strong> Круглосуточно
              </p>
            </div>
          </section>
        </div>
    </StaticPage>
  );
}
