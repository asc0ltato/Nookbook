import { StaticPage } from "@/components/shared/StaticPage";
import Link from "next/link";

export default function FAQPage() {
  return (
    <StaticPage>
        <h1 className="text-4xl font-bold mb-8">Вопросы и ответы</h1>
        
        <div className="space-y-6">
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Общие вопросы</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Что такое NookBook?</h3>
                <p className="text-muted-foreground">
                  NookBook — это онлайн-сервис для поиска и бронирования отелей в Беларуси. 
                  Мы помогаем путешественникам находить идеальное жилье по лучшим ценам.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Нужна ли регистрация для бронирования?</h3>
                <p className="text-muted-foreground">
                  Регистрация не обязательна, но рекомендуется. С аккаунтом вы сможете управлять 
                  бронированиями, сохранять избранные отели и быстрее оформлять заказы.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Какие города доступны для бронирования?</h3>
                <p className="text-muted-foreground">
                  Сейчас доступно бронирование в Минске, Бресте, Витебске, Гомеле, Гродно и Могилеве. 
                  Мы постоянно расширяем географию.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Бронирование</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Как забронировать отель?</h3>
                <p className="text-muted-foreground">
                  Выберите город, даты и количество гостей на главной странице. Затем выберите отель 
                  из списка, укажите данные гостя и подтвердите бронирование. 
                  <Link href="/faq/how-to-book" className="text-primary hover:underline ml-1">
                    Подробная инструкция →
                  </Link>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Когда я получу подтверждение бронирования?</h3>
                <p className="text-muted-foreground">
                  Подтверждение приходит мгновенно на указанную электронную почту после оформления бронирования. 
                  Проверьте папку "Спам", если письмо не пришло в течение 5 минут.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Можно ли изменить даты бронирования?</h3>
                <p className="text-muted-foreground">
                  Это зависит от условий конкретного отеля. Свяжитесь с нашей поддержкой или напрямую с отелем 
                  для уточнения возможности изменения дат.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">За сколько можно отменить бронирование?</h3>
                <p className="text-muted-foreground">
                  Условия отмены зависят от выбранного тарифа и политики отеля. Обычно это от 24 часов до 7 дней 
                  до заезда. Подробные условия указаны при бронировании.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Оплата</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Нужно ли платить при бронировании?</h3>
                <p className="text-muted-foreground">
                  Большинство отелей не требуют предоплаты. Оплата производится при заезде или выезде из отеля. 
                  Условия оплаты указаны в описании каждого отеля.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Какие способы оплаты принимаются?</h3>
                <p className="text-muted-foreground">
                  Способы оплаты зависят от отеля. Обычно принимаются наличные и банковские карты. 
                  Точная информация указана в деталях отеля.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Берете ли вы комиссию за бронирование?</h3>
                <p className="text-muted-foreground">
                  Нет, наш сервис не взимает дополнительных комиссий. Цена, которую вы видите на сайте, 
                  является окончательной.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Включены ли налоги в цену?</h3>
                <p className="text-muted-foreground">
                  Да, все цены на сайте указаны с учетом всех налогов и сборов. Никаких скрытых платежей нет.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Проживание</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Во сколько можно заехать в отель?</h3>
                <p className="text-muted-foreground">
                  Стандартное время заезда — с 14:00. Точное время указано в деталях каждого отеля. 
                  При необходимости раннего заезда свяжитесь с отелем заранее.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">До какого времени нужно выехать?</h3>
                <p className="text-muted-foreground">
                  Обычно выезд до 12:00. Некоторые отели предлагают поздний выезд за дополнительную плату. 
                  Проверьте условия конкретного отеля.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Что делать, если опаздываю на заезд?</h3>
                <p className="text-muted-foreground">
                  Обязательно свяжитесь с отелем и предупредите о задержке. Контакты отеля указаны 
                  в подтверждении бронирования.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Можно ли поселиться с домашними животными?</h3>
                <p className="text-muted-foreground">
                  Это зависит от политики отеля. Используйте фильтр "Размещение с животными" при поиске, 
                  чтобы найти подходящие варианты.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Технические вопросы</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Не приходит письмо с подтверждением</h3>
                <p className="text-muted-foreground">
                  Проверьте папку "Спам". Если письма нет, свяжитесь с поддержкой — мы вышлем подтверждение повторно.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Забыл пароль от аккаунта</h3>
                <p className="text-muted-foreground">
                  На странице входа нажмите "Забыли пароль?" и следуйте инструкциям для восстановления доступа.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Как удалить аккаунт?</h3>
                <p className="text-muted-foreground">
                  Напишите на support@nookbook.by с просьбой удалить аккаунт. Мы обработаем запрос в течение 3 рабочих дней.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-primary/10 border border-primary/30 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-3">Не нашли ответ на свой вопрос?</h2>
            <p className="text-muted-foreground mb-4">
              Свяжитесь с нашей службой поддержки — мы с радостью поможем!
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
