using FluentValidation;
using NookBook.API.DTOs;

namespace NookBook.API.Validators;

public class RegisterUserValidator : AbstractValidator<RegisterUserDto>
{
    public RegisterUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email обязателен")
            .EmailAddress().WithMessage("Некорректный email адрес")
            .MaximumLength(100).WithMessage("Email не должен превышать 100 символов");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Пароль обязателен")
            .MinimumLength(8).WithMessage("Пароль должен содержать минимум 8 символов")
            .Matches("[A-Z]").WithMessage("Пароль должен содержать хотя бы одну заглавную букву")
            .Matches("[a-z]").WithMessage("Пароль должен содержать хотя бы одну строчную букву")
            .Matches("[0-9]").WithMessage("Пароль должен содержать хотя бы одну цифру");

        RuleFor(x => x.FirstName)
            .MaximumLength(50).WithMessage("Имя не должно превышать 50 символов")
            .When(x => !string.IsNullOrWhiteSpace(x.FirstName));

        RuleFor(x => x.LastName)
            .MaximumLength(50).WithMessage("Фамилия не должна превышать 50 символов")
            .When(x => !string.IsNullOrWhiteSpace(x.LastName));

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+?[0-9\-\s\(\)]{8,20}$").WithMessage("Некорректный формат телефона")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));
    }
}
