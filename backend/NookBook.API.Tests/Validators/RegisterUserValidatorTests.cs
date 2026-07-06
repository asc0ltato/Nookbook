using FluentAssertions;
using NookBook.API.DTOs;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Validators;

[TestFixture]
public class RegisterUserValidatorTests
{
    private readonly RegisterUserValidator _validator = new();

    private static RegisterUserDto ValidDto() => new()
    {
        Email = "user@example.com",
        Password = "Password1",
        FirstName = "Ivan",
        LastName = "Ivanov",
        PhoneNumber = "+375291234567"
    };

    [Test]
    public void Validate_EmptyEmail_Fails()
    {
        var dto = ValidDto();
        dto.Email = "";

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterUserDto.Email));
    }

    [Test]
    public void Validate_InvalidEmail_Fails()
    {
        var dto = ValidDto();
        dto.Email = "not-an-email";

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("email", StringComparison.OrdinalIgnoreCase));
    }

    [Test]
    public void Validate_ShortPassword_Fails()
    {
        var dto = ValidDto();
        dto.Password = "Pass1";

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterUserDto.Password));
    }

    [Test]
    public void Validate_PasswordWithoutUppercase_Fails()
    {
        var dto = ValidDto();
        dto.Password = "password1";

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("заглавн", StringComparison.OrdinalIgnoreCase));
    }

    [Test]
    public void Validate_PasswordWithoutDigit_Fails()
    {
        var dto = ValidDto();
        dto.Password = "Passwordd";

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("цифр", StringComparison.OrdinalIgnoreCase));
    }

    [Test]
    public void Validate_InvalidPhone_Fails()
    {
        var dto = ValidDto();
        dto.PhoneNumber = "abc";

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterUserDto.PhoneNumber));
    }

    [Test]
    public void Validate_ValidDto_Succeeds()
    {
        var result = _validator.Validate(ValidDto());

        result.IsValid.Should().BeTrue();
    }

    [Test]
    public void Validate_LongFirstName_Fails()
    {
        var dto = ValidDto();
        dto.FirstName = new string('A', 51);

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }
}
