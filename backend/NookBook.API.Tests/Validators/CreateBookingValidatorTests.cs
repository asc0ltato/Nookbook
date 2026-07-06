using FluentAssertions;
using NookBook.API.DTOs;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Validators;

[TestFixture]
public class CreateBookingValidatorTests
{
    private readonly CreateBookingValidator _validator = new();

    private static CreateBookingDto ValidDto() => new()
    {
        UserId = 1,
        RoomId = 1,
        CheckInDate = DateTime.Today.AddDays(1),
        CheckOutDate = DateTime.Today.AddDays(3),
        GuestCount = 2
    };

    [Test]
    public void Validate_CheckInInPast_Fails()
    {
        var dto = ValidDto();
        dto.CheckInDate = DateTime.Today.AddDays(-1);
        dto.CheckOutDate = DateTime.Today.AddDays(1);

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("прошл", StringComparison.OrdinalIgnoreCase));
    }

    [Test]
    public void Validate_CheckOutNotAfterCheckIn_Fails()
    {
        var dto = ValidDto();
        dto.CheckOutDate = dto.CheckInDate;

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_ZeroGuests_Fails()
    {
        var dto = ValidDto();
        dto.GuestCount = 0;

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_TooManyGuests_Fails()
    {
        var dto = ValidDto();
        dto.GuestCount = 11;

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_SpecialRequestsTooLong_Fails()
    {
        var dto = ValidDto();
        dto.SpecialRequests = new string('x', 1001);

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_ValidWithRoomId_Succeeds()
    {
        var result = _validator.Validate(ValidDto());

        result.IsValid.Should().BeTrue();
    }

    [Test]
    public void Validate_ValidWithRoomType_Succeeds()
    {
        var dto = new CreateBookingDto
        {
            UserId = 1,
            HotelId = 1,
            RoomTypeId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            GuestCount = 2
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Test]
    public void Validate_InvalidUserId_Fails()
    {
        var dto = ValidDto();
        dto.UserId = 0;

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }
}
