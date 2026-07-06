using FluentValidation;
using NookBook.API.DTOs;

namespace NookBook.API.Validators;

public class CreateHotelValidator : AbstractValidator<CreateHotelDto>
{
    public CreateHotelValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Название отеля обязательно")
            .MaximumLength(200).WithMessage("Название не должно превышать 200 символов");
        
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Описание обязательно")
            .MaximumLength(2000).WithMessage("Описание не должно превышать 2000 символов");
        
        RuleFor(x => x.Stars)
            .InclusiveBetween(0, 5).WithMessage("Количество звезд должно быть от 0 до 5");
        
        RuleFor(x => x.CityId)
            .GreaterThan(0).WithMessage("Необходимо указать город");
        
        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Адрес обязателен")
            .MaximumLength(500).WithMessage("Адрес не должен превышать 500 символов");

        RuleFor(x => x.ManagerEmail)
            .MaximumLength(200).WithMessage("Email менеджера не должен превышать 200 символов")
            .EmailAddress().WithMessage("Некорректный email менеджера")
            .When(x => !string.IsNullOrWhiteSpace(x.ManagerEmail));

        When(x => x.ManagerEmails != null && x.ManagerEmails.Count > 0, () =>
        {
            RuleForEach(x => x.ManagerEmails!)
                .MaximumLength(200).WithMessage("Email менеджера не должен превышать 200 символов")
                .EmailAddress().WithMessage("Некорректный email менеджера");
        });
    }
}
