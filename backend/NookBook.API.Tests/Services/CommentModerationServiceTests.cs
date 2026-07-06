using FluentAssertions;
using NookBook.API.Services;
using NUnit.Framework;

namespace NookBook.API.Tests.Services;

[TestFixture]
public class CommentModerationServiceTests
{
    private readonly CommentModerationService _service = new();

    [Test]
    public void Analyze_EmptyComment_ReturnsCleanResult()
    {
        var result = _service.Analyze("   ");

        result.HasProfanity.Should().BeFalse();
        result.HasSpam.Should().BeFalse();
        result.SanitizedText.Should().BeEmpty();
    }

    [Test]
    public void Analyze_CleanComment_ReturnsNoFlags()
    {
        var result = _service.Analyze("Отличный номер и вежливый персонал");

        result.HasProfanity.Should().BeFalse();
        result.HasSpam.Should().BeFalse();
    }

    [Test]
    public void Analyze_ProfanityWord_DetectsProfanity()
    {
        var result = _service.Analyze("Вы идиот");

        result.HasProfanity.Should().BeTrue();
    }

    [Test]
    public void Analyze_UrlInComment_DetectsSpam()
    {
        var result = _service.Analyze("Смотрите https://spam.example.com");

        result.HasSpam.Should().BeTrue();
        result.SpamReason.Should().Contain("ссылки");
    }

    [Test]
    public void Analyze_PhoneNumber_DetectsSpam()
    {
        var result = _service.Analyze("Звоните +375 29 123 45 67");

        result.HasSpam.Should().BeTrue();
    }

    [Test]
    public void Analyze_AdPhrase_DetectsSpam()
    {
        var result = _service.Analyze("купи номер со скидкой");

        result.HasSpam.Should().BeTrue();
    }

    [Test]
    public void ContainsBlacklistedWords_Profanity_ReturnsTrue()
    {
        _service.ContainsBlacklistedWords("тупой").Should().BeTrue();
    }

    [Test]
    public void AddAndRemoveBlacklistedWord_Works()
    {
        _service.AddBlacklistedWord("testbadword");
        _service.ContainsBlacklistedWords("testbadword").Should().BeTrue();
        _service.RemoveBlacklistedWord("testbadword");
        _service.ContainsBlacklistedWords("testbadword").Should().BeFalse();
    }

    [Test]
    public void GetBlacklistedWords_ReturnsCollection()
    {
        var words = _service.GetBlacklistedWords();

        words.Should().NotBeEmpty();
    }
}
