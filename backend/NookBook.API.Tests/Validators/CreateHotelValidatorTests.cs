using FluentAssertions;
using NookBook.API.DTOs;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Validators;

[TestFixture]
public class CreateHotelValidatorTests
{
    private readonly CreateHotelValidator _validator = new();

    [Test]
    public void Validate_EmptyName_Fails()
    {
        var dto = new CreateHotelDto { Name = "", Description = "Desc", Stars = 3, CityId = 1, Address = "Addr" };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_StarsOutOfRange_Fails()
    {
        var dto = new CreateHotelDto { Name = "Hotel", Description = "Desc", Stars = 6, CityId = 1, Address = "Addr" };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_InvalidManagerEmail_Fails()
    {
        var dto = new CreateHotelDto
        {
            Name = "Hotel",
            Description = "Desc",
            Stars = 4,
            CityId = 1,
            Address = "Addr",
            ManagerEmail = "bad-email"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_ValidDto_Succeeds()
    {
        var dto = new CreateHotelDto
        {
            Name = "Hotel",
            Description = "Описание отеля",
            Stars = 4,
            CityId = 1,
            Address = "ул. Пример, 1"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
