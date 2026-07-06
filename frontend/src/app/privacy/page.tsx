import { StaticPage } from "@/components/shared/StaticPage";

export default function PrivacyPage() {
  return (
    <StaticPage>
        <h1 className="text-4xl font-bold mb-8">Политика конфиденциальности</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Общие положения</h2>
            <p className="leading-relaxed">
              Настоящая Политика конфиденциальности (далее — Политика) определяет порядок обработки 
              и защиты персональных данных пользователей сервиса NookBook (далее — Сервис).
            </p>
            <p className="leading-relaxed">
              Используя Сервис, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны 
              с какими-либо положениями Политики, пожалуйста, не используйте Сервис.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Собираемая информация</h2>
            <p className="leading-relaxed mb-3"><strong className="text-foreground">2.1. Информация, предоставляемая пользователем:</strong></p>
            <ul className="space-y-2 list-disc list-inside mb-4">
              <li>Имя и фамилия</li>
              <li>Адрес электронной почты</li>
              <li>Номер телефона</li>
              <li>Данные для бронирования (даты поездки, количество гостей)</li>
            </ul>
            
            <p className="leading-relaxed mb-3"><strong className="text-foreground">2.2. Автоматически собираемая информация:</strong></p>
            <ul className="space-y-2 list-disc list-inside">
              <li>IP-адрес</li>
              <li>Тип и версия браузера</li>
              <li>Операционная система</li>
              <li>История поиска и бронирований</li>
              <li>Данные cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Цели обработки данных</h2>
            <p className="leading-relaxed mb-3">Мы используем собранную информацию для следующих целей:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Обработка бронирований и предоставление запрошенных услуг</li>
              <li>Связь с пользователями по вопросам бронирования</li>
              <li>Улучшение работы Сервиса и персонализация предложений</li>
              <li>Отправка уведомлений о статусе бронирования</li>
              <li>Анализ использования Сервиса</li>
              <li>Обеспечение безопасности и предотвращение мошенничества</li>
              <li>Соблюдение законодательных требований</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Передача данных третьим лицам</h2>
            <p className="leading-relaxed mb-3">
              Мы можем передавать ваши персональные данные следующим категориям получателей:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Отелям:</strong> для обработки вашего бронирования</li>
              <li><strong className="text-foreground">Платежным системам:</strong> для обработки платежей</li>
              <li><strong className="text-foreground">Сервисным провайдерам:</strong> которые помогают нам в работе Сервиса</li>
              <li><strong className="text-foreground">Государственным органам:</strong> при наличии законных оснований</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Мы не продаем и не передаем ваши персональные данные третьим лицам в маркетинговых целях.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Cookies и аналогичные технологии</h2>
            <p className="leading-relaxed">
              Сервис использует cookies и аналогичные технологии для улучшения пользовательского опыта, 
              анализа трафика и персонализации контента.
            </p>
            <p className="leading-relaxed">
              Вы можете настроить свой браузер для отклонения cookies, однако это может ограничить 
              функциональность Сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Защита данных</h2>
            <p className="leading-relaxed mb-3">Мы применяем следующие меры для защиты ваших данных:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Шифрование данных при передаче (SSL/TLS)</li>
              <li>Ограниченный доступ к персональным данным сотрудников</li>
              <li>Регулярный мониторинг систем безопасности</li>
              <li>Использование защищенных серверов</li>
              <li>Регулярное обновление систем защиты</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Ваши права</h2>
            <p className="leading-relaxed mb-3">Вы имеете право:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Получить доступ к своим персональным данным</li>
              <li>Исправить неточные данные</li>
              <li>Запросить удаление данных</li>
              <li>Ограничить обработку данных</li>
              <li>Возразить против обработки</li>
              <li>Получить копию данных в структурированном формате</li>
              <li>Отозвать согласие на обработку данных</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Для реализации своих прав обращайтесь по адресу: support@nookbook.by
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Хранение данных</h2>
            <p className="leading-relaxed">
              Мы храним ваши персональные данные в течение периода, необходимого для достижения целей, 
              указанных в настоящей Политике, или в соответствии с требованиями законодательства.
            </p>
            <p className="leading-relaxed">
              После истечения срока хранения данные удаляются или обезличиваются.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Дети</h2>
            <p className="leading-relaxed">
              Сервис не предназначен для лиц младше 18 лет. Мы сознательно не собираем персональные 
              данные детей. Если нам станет известно о сборе данных ребенка, мы незамедлительно удалим эту информацию.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Изменения в Политике</h2>
            <p className="leading-relaxed">
              Мы можем периодически обновлять настоящую Политику. О существенных изменениях мы уведомим 
              вас по электронной почте или через Сервис.
            </p>
            <p className="leading-relaxed">
              Рекомендуем регулярно проверять эту страницу для ознакомления с актуальной версией Политики.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Контактная информация</h2>
            <div className="bg-card border border-border rounded-lg p-6 space-y-2">
              <p>По вопросам обработки персональных данных обращайтесь:</p>
              <p><strong className="text-foreground">Email:</strong> support@nookbook.by</p>
              <p><strong className="text-foreground">Телефон:</strong> +375 29 123-45-67</p>
            </div>
          </section>
        </div>
    </StaticPage>
  );
}
