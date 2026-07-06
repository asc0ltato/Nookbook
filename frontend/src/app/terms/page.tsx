import { StaticPage } from "@/components/shared/StaticPage";

export default function TermsPage() {
  return (
    <StaticPage>
        <h1 className="text-4xl font-bold mb-8">Пользовательское соглашение</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Общие положения</h2>
            <p className="leading-relaxed">
              Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между 
              владельцем сервиса NookBook (далее — Сервис) и пользователем сервиса (далее — Пользователь).
            </p>
            <p className="leading-relaxed">
              Использование Сервиса означает безоговорочное согласие Пользователя с настоящим Соглашением 
              и указанными в нем условиями. В случае несогласия с этими условиями Пользователь должен 
              воздержаться от использования Сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Предмет соглашения</h2>
            <p className="leading-relaxed">
              Сервис предоставляет Пользователю доступ к платформе для поиска и бронирования отелей 
              на территории Республики Беларусь.
            </p>
            <p className="leading-relaxed">
              Сервис выступает посредником между Пользователем и отелями, предоставляя информационные 
              услуги и техническую возможность для осуществления бронирования.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Регистрация и учетная запись</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Для использования некоторых функций Сервиса требуется регистрация.</li>
              <li>При регистрации Пользователь обязуется предоставить достоверную и актуальную информацию.</li>
              <li>Пользователь несет ответственность за сохранность данных своей учетной записи.</li>
              <li>Пользователь обязуется немедленно уведомить Сервис о любом несанкционированном доступе к учетной записи.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Бронирование</h2>
            <p className="leading-relaxed">
              <strong className="text-foreground">4.1.</strong> Бронирование осуществляется через интерфейс Сервиса путем выбора отеля, 
              дат проживания и оформления заявки.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">4.2.</strong> После оформления бронирования Пользователь получает подтверждение на указанный 
              электронный адрес.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">4.3.</strong> Условия оплаты, отмены и возврата определяются политикой конкретного отеля 
              и указываются на странице бронирования.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">4.4.</strong> Пользователь обязуется ознакомиться с условиями отеля перед оформлением бронирования.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Цены и оплата</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Все цены на Сервисе указаны в белорусских рублях (BYN) с учетом НДС.</li>
              <li>Цены могут изменяться отелями без предварительного уведомления.</li>
              <li>Сервис не взимает дополнительных комиссий за бронирование.</li>
              <li>Оплата производится напрямую отелю согласно его условиям.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Отмена и возврат</h2>
            <p className="leading-relaxed">
              Условия отмены бронирования и возврата средств определяются политикой конкретного отеля. 
              Сервис не несет ответственности за условия отмены, установленные отелями.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Ответственность</h2>
            <p className="leading-relaxed">
              <strong className="text-foreground">7.1.</strong> Сервис не несет ответственности за качество услуг, предоставляемых отелями.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">7.2.</strong> Сервис прилагает усилия для обеспечения точности информации об отелях, 
              но не гарантирует ее полноту и актуальность.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">7.3.</strong> Пользователь использует Сервис на свой риск. Сервис не несет ответственности 
              за прямые или косвенные убытки, возникшие в результате использования платформы.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Интеллектуальная собственность</h2>
            <p className="leading-relaxed">
              Все материалы Сервиса, включая текст, графику, логотипы и программное обеспечение, 
              защищены авторским правом и принадлежат Сервису или его партнерам.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Изменение условий</h2>
            <p className="leading-relaxed">
              Сервис оставляет за собой право изменять условия настоящего Соглашения в любое время. 
              Изменения вступают в силу с момента их публикации на сайте.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Контактная информация</h2>
            <div className="bg-card border border-border rounded-lg p-6 space-y-2">
              <p>По всем вопросам, связанным с настоящим Соглашением, обращайтесь:</p>
              <p><strong className="text-foreground">Email:</strong> support@nookbook.by</p>
              <p><strong className="text-foreground">Телефон:</strong> +375 29 123-45-67</p>
            </div>
          </section>
        </div>
    </StaticPage>
  );
}
