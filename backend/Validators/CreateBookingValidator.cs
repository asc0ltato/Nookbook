using FluentValidation;
using NookBook.API.DTOs;

namespace NookBook.API.Validators;

public class CreateBookingValidator : AbstractValidator<CreateBookingDto>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.UserId)
            .GreaterThan(0).WithMessage("Необходимо указать пользователя");

        RuleFor(x => x.HotelId)
            .GreaterThan(0).When(x => x.RoomTypeId != null).WithMessage("Необходимо указать отель");

        RuleFor(x => x.RoomId)
            .GreaterThan(0).When(x => x.RoomTypeId == null).WithMessage("Необходимо указать номер или тип номера");

        RuleFor(x => x.RoomTypeId)
            .GreaterThan(0).When(x => x.RoomId == null).WithMessage("Необходимо указать номер или тип номера");

        RuleFor(x => x.CheckInDate)
            .NotEmpty().WithMessage("Дата заезда обязательна")
            .Must(date => date.Date >= DateTime.Today.Date).WithMessage("Дата заезда не может быть в прошлом");

        RuleFor(x => x.CheckOutDate)
            .NotEmpty().WithMessage("Дата выезда обязательна")
            .GreaterThan(x => x.CheckInDate).WithMessage("Дата выезда должна быть позже даты заезда");

        RuleFor(x => x.GuestCount)
            .GreaterThan(0).WithMessage("Количество гостей должно быть больше 0")
            .LessThanOrEqualTo(10).WithMessage("Количество гостей не должно превышать 10");

        RuleFor(x => x.SpecialRequests)
            .MaximumLength(1000).WithMessage("Особые пожелания не должны превышать 1000 символов");
    }
}
