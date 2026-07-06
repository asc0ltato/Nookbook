using FluentAssertions;
using NookBook.API.DTOs;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Validators;

[TestFixture]
public class CreateReviewValidatorTests
{
    private readonly CreateReviewValidator _validator = new();

    [Test]
    public void Validate_RatingBelowMinimum_Fails()
    {
        var dto = new CreateReviewDto
        {
            BookingId = 1,
            Rating = 0,
            Comment = "Хороший отель, все понравилось"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_RatingAboveMaximum_Fails()
    {
        var dto = new CreateReviewDto
        {
            BookingId = 1,
            Rating = 11,
            Comment = "Хороший отель, все понравилось"  
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_ShortComment_Fails()
    {
        var dto = new CreateReviewDto
        {
            BookingId = 1,
            Rating = 8,
            Comment = "Коротко"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_NoTagsAndNoComment_Fails()
    {
        var dto = new CreateReviewDto
        {
            BookingId = 1,
            Rating = 8
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeFalse();
    }

    [Test]
    public void Validate_WithPositiveTag_Succeeds()
    {
        var dto = new CreateReviewDto
        {
            BookingId = 1,
            Rating = 9,
            PositiveTags = new List<string> { "Чистота" }
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }

    [Test]
    public void Validate_ValidComment_Succeeds()
    {
        var dto = new CreateReviewDto
        {
            BookingId = 1,
            Rating = 10,
            Comment = "Отличный отель, рекомендую всем"
        };

        var result = _validator.Validate(dto);

        result.IsValid.Should().BeTrue();
    }
}
