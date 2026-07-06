import { StaticPage } from "@/components/shared/StaticPage"; 
import Link from "next/link";

export default function HowToBookPage() {
  return (
    <StaticPage>
        <div className="mb-6">
          <Link href="/faq" className="text-primary hover:underline">
            ← Вернуться к FAQ
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8">Как забронировать отель</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-lg text-muted-foreground">
            Бронирование отеля на NookBook — простой и удобный процесс. Следуйте нашей пошаговой инструкции.
          </p>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
              Найдите подходящий отель
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>На главной странице введите параметры поиска:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-foreground">Город</strong> — выберите город, в котором хотите остановиться</li>
                <li><strong className="text-foreground">Даты заезда и выезда</strong> — укажите период проживания</li>
                <li><strong className="text-foreground">Количество гостей</strong> — укажите, сколько человек будет проживать</li>
              </ul>
              <p className="mt-3">Нажмите кнопку <span className="text-primary font-semibold">"Найти"</span> для начала поиска.</p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
              Выберите отель из списка
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>Используйте фильтры для уточнения поиска:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li><strong className="text-foreground">Цена</strong> — установите ценовой диапазон</li>
                <li><strong className="text-foreground">Рейтинг</strong> — выберите отели с нужным рейтингом</li>
                <li><strong className="text-foreground">Удобства</strong> — отфильтруйте по наличию Wi-Fi, парковки, завтрака и т.д.</li>
                <li><strong className="text-foreground">Тип размещения</strong> — выберите отель, хостел или апартаменты</li>
              </ul>
              <p className="mt-3">Изучите карточки отелей, посмотрите фотографии и почитайте отзывы других гостей.</p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
              Изучите детали отеля
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>Нажмите на карточку отеля, чтобы увидеть подробную информацию:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Полное описание и фотографии номеров</li>
                <li>Список всех удобств и услуг</li>
                <li>Расположение на карте</li>
                <li>Отзывы гостей с оценками</li>
                <li>Правила отеля и условия отмены</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
              Выберите номер
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>Выберите подходящий тип номера:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Сравните цены и характеристики разных номеров</li>
                <li>Обратите внимание на условия отмены</li>
                <li>Проверьте, что входит в стоимость (завтрак, уборка и т.д.)</li>
              </ul>
              <p className="mt-3">Нажмите <span className="text-primary font-semibold">"Забронировать"</span> на выбранном номере.</p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">5</span>
              Заполните данные гостя
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>Введите информацию для бронирования:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Имя и фамилия гостя</li>
                <li>Контактный номер телефона</li>
                <li>Адрес электронной почты</li>
                <li>Особые пожелания (при необходимости)</li>
              </ul>
              <p className="mt-3 font-semibold text-foreground">Важно: указывайте реальные данные — они нужны для связи с вами.</p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">6</span>
              Подтвердите бронирование
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>Проверьте все детали бронирования:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Даты проживания</li>
                <li>Тип и количество номеров</li>
                <li>Общую стоимость</li>
                <li>Условия оплаты и отмены</li>
              </ul>
              <p className="mt-3">Нажмите <span className="text-primary font-semibold">"Подтвердить бронирование"</span>.</p>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">7</span>
              Получите подтверждение
            </h2>
            <div className="ml-11 space-y-3 text-muted-foreground">
              <p>После успешного бронирования:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>На вашу почту придёт письмо с подтверждением</li>
                <li>В письме будет номер бронирования и все детали</li>
                <li>Вы сможете отслеживать бронирование в личном кабинете</li>
                <li>При необходимости можно связаться с отелем напрямую</li>
              </ul>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Полезные советы</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Бронируйте заранее — так больше выбор и часто ниже цены</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Читайте отзывы других гостей перед бронированием</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Проверяйте условия отмены — они могут различаться у разных отелей</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Сохраните письмо с подтверждением — оно понадобится при заезде</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Если планы изменились, отмените бронирование заранее по правилам отеля</span>
              </li>
            </ul>
          </section>

          <section className="bg-primary/10 border border-primary/30 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-3">Нужна помощь?</h2>
            <p className="text-muted-foreground mb-4">
              Если у вас возникли вопросы на любом этапе бронирования, наша служба поддержки готова помочь.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Email:</strong> support@nookbook.by</p>
              <p><strong className="text-foreground">Телефон:</strong> +375 29 123-45-67</p>
              <p><strong className="text-foreground">Время работы:</strong> Круглосуточно</p>
            </div>
          </section>
        </div>
    </StaticPage>
  );
}
