using FluentValidation;
using NookBook.API.DTOs;
using System.Linq;

namespace NookBook.API.Validators;

public class CreateReviewValidator : AbstractValidator<CreateReviewDto>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.BookingId)
            .GreaterThan(0).WithMessage("Необходимо указать бронирование");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 10).WithMessage("Рейтинг должен быть от 1 до 10");

        RuleFor(x => x.Comment)
            .MinimumLength(10).When(x => !string.IsNullOrWhiteSpace(x.Comment)).WithMessage("Комментарий должен содержать минимум 10 символов")
            .MaximumLength(1000).WithMessage("Комментарий не должен превышать 1000 символов");

        RuleFor(x => x)
            .Must(x => (x.PositiveTags?.Any() == true) || (x.NegativeTags?.Any() == true) || !string.IsNullOrWhiteSpace(x.Comment))
            .WithMessage("Добавьте хотя бы один тег или комментарий");
    }
}
