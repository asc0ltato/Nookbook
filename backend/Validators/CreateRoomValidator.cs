using FluentValidation;
using NookBook.API.DTOs;

namespace NookBook.API.Validators;

public class CreateRoomValidator : AbstractValidator<CreateRoomDto>
{
    public CreateRoomValidator()
    {
        RuleFor(x => x.HotelId)
            .GreaterThan(0).WithMessage("Необходимо указать отель");

        RuleFor(x => x.RoomTypeId)
            .GreaterThan(0).WithMessage("Необходимо указать тип номера");

        RuleFor(x => x.RoomNumber)
            .NotEmpty().WithMessage("Необходимо указать номер комнаты")
            .MaximumLength(20).WithMessage("Номер комнаты не должен превышать 20 символов");

        RuleFor(x => x.Name)
            .MaximumLength(20).WithMessage("Номер комнаты не должен превышать 20 символов")
            .When(x => !string.IsNullOrWhiteSpace(x.Name));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Описание не должно превышать 500 символов")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Цена должна быть больше 0")
            .LessThanOrEqualTo(1000).WithMessage("Цена не должна превышать 1000 BYN")
            .When(x => x.Price.HasValue);

        RuleFor(x => x.MealType)
            .InclusiveBetween(0, 2).WithMessage("Неверный тип питания")
            .When(x => x.MealType.HasValue);

        RuleFor(x => x.MaxGuests)
            .GreaterThan(0).WithMessage("Количество гостей должно быть больше 0")
            .LessThanOrEqualTo(50).WithMessage("Количество гостей не должно превышать 50")
            .When(x => x.MaxGuests.HasValue);

        RuleFor(x => x.BedCount)
            .GreaterThan(0).WithMessage("Количество кроватей должно быть больше 0")
            .LessThanOrEqualTo(20).WithMessage("Количество кроватей не должно превышать 20")
            .When(x => x.BedCount.HasValue);

        RuleFor(x => x.Size)
            .GreaterThanOrEqualTo(0).WithMessage("Площадь не может быть отрицательной")
            .LessThanOrEqualTo(150).WithMessage("Площадь не должна превышать 150 м²")
            .When(x => x.Size.HasValue);
    }
}
