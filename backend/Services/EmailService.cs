using System.Net;
using System.Net.Mail;

namespace NookBook.API.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetCodeAsync(string email, string code)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = (emailSettings["SenderPassword"] ?? string.Empty).Replace(" ", string.Empty).Trim();
            var senderName = emailSettings["SenderName"] ?? "NookBook";

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning($"Email не настроен. Код для {email}: {code}");
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = "Код восстановления пароля - NookBook",
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; text-align: center;'>
                            <h1 style='color: white; margin: 0;'>NookBook</h1>
                        </div>
                        <div style='padding: 30px; background: #f9fafb;'>
                            <h2 style='color: #1f2937;'>Восстановление пароля</h2>
                            <p style='color: #4b5563;'>Ваш код подтверждения:</p>
                            <div style='background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                                <h1 style='color: #f59e0b; font-size: 36px; letter-spacing: 8px; margin: 0;'>{code}</h1>
                            </div>
                            <p style='color: #6b7280; font-size: 14px;'>Этот код действителен в течение 10 минут.</p>
                            <p style='color: #6b7280; font-size: 12px; margin-top: 20px;'>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
                        </div>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation($"Email отправлен на {email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Ошибка отправки email на {email}");
            _logger.LogWarning($"Код для {email}: {code}");
        }
    }

    public async Task SendLoginCodeAsync(string email, string code)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = (emailSettings["SenderPassword"] ?? string.Empty).Replace(" ", string.Empty).Trim();
            var senderName = emailSettings["SenderName"] ?? "NookBook";

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning($"Email не настроен. Код входа для {email}: {code}");
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = "Код входа - NookBook",
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; text-align: center;'>
                            <h1 style='color: white; margin: 0;'>NookBook</h1>
                        </div>
                        <div style='padding: 30px; background: #f9fafb;'>
                            <h2 style='color: #1f2937;'>Вход в аккаунт</h2>
                            <p style='color: #4b5563;'>Ваш код для входа:</p>
                            <div style='background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                                <h1 style='color: #f59e0b; font-size: 36px; letter-spacing: 8px; margin: 0;'>{code}</h1>
                            </div>
                            <p style='color: #6b7280; font-size: 14px;'>Этот код действителен в течение 10 минут.</p>
                            <p style='color: #6b7280; font-size: 12px; margin-top: 20px;'>Если вы не запрашивали вход, проигнорируйте это письмо.</p>
                        </div>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation($"Email с кодом входа отправлен на {email}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Ошибка отправки email на {email}");
            _logger.LogWarning($"Код входа для {email}: {code}");
        }
    }

    public async Task SendBookingConfirmationAsync(
        string email,
        string guestFullName,
        string bookingCode,
        string hotelName,
        string roomType,
        DateTime checkInDate,
        DateTime checkOutDate,
        decimal totalPrice,
        string cancelLink)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = (emailSettings["SenderPassword"] ?? string.Empty).Replace(" ", string.Empty).Trim();
            var senderName = emailSettings["SenderName"] ?? "NookBook";

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning("Email не настроен. Код бронирования для {Email}: {Code}", email, bookingCode);
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = $"Ваше бронирование подтверждено: {bookingCode}",
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 24px; text-align: center; color: white;'>
                            <h1 style='margin: 0;'>NookBook</h1>
                            <p style='margin: 8px 0 0;'>Бронирование подтверждено</p>
                        </div>
                        <div style='padding: 24px; background: #f9fafb;'>
                            <p style='margin-top: 0;'>Здравствуйте, {guestFullName}!</p>
                            <p>Ваше бронирование успешно подтверждено.</p>
                            <div style='background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin: 16px 0;'>
                                <div style='font-size: 13px; color: #6b7280;'>Код бронирования</div>
                                <div style='font-size: 30px; font-weight: 700; color: #0f172a; margin: 6px 0 14px;'>{bookingCode}</div>
                                <div><b>Отель:</b> {hotelName}</div>
                                <div><b>Тип номера:</b> {roomType}</div>
                                <div><b>Даты:</b> {checkInDate:dd.MM.yyyy} - {checkOutDate:dd.MM.yyyy}</div>
                                <div><b>Сумма:</b> {totalPrice:N0} BYN</div>
                            </div>
                            <p>
                                <a href='{cancelLink}' style='display:inline-block;background:#ef4444;color:white;text-decoration:none;padding:10px 14px;border-radius:8px;'>
                                    Перейти к отмене бронирования
                                </a>
                            </p>
                        </div>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);
            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Письмо подтверждения бронирования отправлено на {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка отправки подтверждения бронирования на {Email}", email);
        }
    }

    public async Task SendBookingStatusChangedAsync(
        string email,
        string guestFullName,
        string bookingCode,
        string localizedStatus)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = (emailSettings["SenderPassword"] ?? string.Empty).Replace(" ", string.Empty).Trim();
            var senderName = emailSettings["SenderName"] ?? "NookBook";

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning("Email не настроен. Статус бронирования для {Email}: {Code} -> {Status}", email, bookingCode, localizedStatus);
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = $"Обновление статуса бронирования: {bookingCode}",
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 24px; text-align: center; color: white;'>
                            <h1 style='margin: 0;'>NookBook</h1>
                            <p style='margin: 8px 0 0;'>Статус бронирования обновлен</p>
                        </div>
                        <div style='padding: 24px; background: #f9fafb;'>
                            <p style='margin-top: 0;'>Здравствуйте, {guestFullName}!</p>
                            <p>Статус вашего бронирования изменен.</p>
                            <div style='background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin: 16px 0;'>
                                <div><b>Код бронирования:</b> {bookingCode}</div>
                                <div><b>Новый статус:</b> {localizedStatus}</div>
                            </div>
                        </div>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);
            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Письмо изменения статуса бронирования отправлено на {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка отправки письма об изменении статуса на {Email}", email);
        }
    }

    public async Task SendBookingReminderAsync(
        string email,
        string guestFullName,
        string bookingCode,
        string hotelName,
        string roomType,
        DateTime checkInDate,
        DateTime checkOutDate,
        int? daysBeforeCheckIn = null)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = (emailSettings["SenderPassword"] ?? string.Empty).Replace(" ", string.Empty).Trim();
            var senderName = emailSettings["SenderName"] ?? "NookBook";

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning("Email не настроен. Напоминание для {Email}: {Code}", email, bookingCode);
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = $"Напоминание о бронировании: {bookingCode}",
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 24px; text-align: center; color: white;'>
                            <h1 style='margin: 0;'>NookBook</h1>
                            <p style='margin: 8px 0 0;'>Напоминание о вашем бронировании</p>
                        </div>
                        <div style='padding: 24px; background: #f9fafb;'>
                            <p style='margin-top: 0;'>Здравствуйте, {guestFullName}!</p>
                            <p>{(daysBeforeCheckIn.HasValue
                                ? $"Напоминаем: до заезда осталось {(daysBeforeCheckIn == 7 ? "7 дней" : daysBeforeCheckIn == 3 ? "3 дня" : "1 день")}."
                                : "Напоминание о предстоящем проживании.")}</p>
                            <div style='background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin: 16px 0;'>
                                <div><b>Код бронирования:</b> {bookingCode}</div>
                                <div><b>Отель:</b> {hotelName}</div>
                                <div><b>Тип номера:</b> {roomType}</div>
                                <div><b>Даты:</b> {checkInDate:dd.MM.yyyy} - {checkOutDate:dd.MM.yyyy}</div>
                            </div>
                        </div>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);
            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Письмо-напоминание отправлено на {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка отправки напоминания на {Email}", email);
        }
    }

    public async Task SendReviewNotificationAsync(string email, string subject, string message)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = (emailSettings["SenderPassword"] ?? string.Empty).Replace(" ", string.Empty).Trim();
            var senderName = emailSettings["SenderName"] ?? "NookBook";

            if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
            {
                _logger.LogWarning("Email не настроен. Уведомление по отзыву для {Email}: {Subject}", email, subject);
                return;
            }

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(senderEmail, senderPassword)
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = $@"
                    <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 24px; text-align: center; color: white;'>
                            <h1 style='margin: 0;'>NookBook</h1>
                            <p style='margin: 8px 0 0;'>Обновление по вашему отзыву</p>
                        </div>
                        <div style='padding: 24px; background: #f9fafb;'>
                            <p style='margin: 0; color: #1f2937;'>{message}</p>
                        </div>
                    </div>",
                IsBodyHtml = true
            };

            mailMessage.To.Add(email);
            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Письмо по отзыву отправлено на {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка отправки email по отзыву на {Email}", email);
        }
    }
}