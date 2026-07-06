using FluentAssertions;
using NookBook.API.DTOs;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Validators;

[TestFixture]
public class CreateRoomValidatorTests
{
    private readonly CreateRoomValidator _validator = new();

    [Test]
    public void Validate_MissingHotelId_Fails()
    {
        var dto = new CreateRoomDto { HotelId = 0, RoomTypeId = 1, RoomNumber = "101" };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_EmptyRoomNumber_Fails()
    {
        var dto = new CreateRoomDto { HotelId = 1, RoomTypeId = 1, RoomNumber = "" };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_PriceOutOfRange_Fails()
    {
        var dto = new CreateRoomDto { HotelId = 1, RoomTypeId = 1, RoomNumber = "101", Price = 2000 };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_ValidDto_Succeeds()
    {
        var dto = new CreateRoomDto { HotelId = 1, RoomTypeId = 1, RoomNumber = "101", Price = 120 };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
