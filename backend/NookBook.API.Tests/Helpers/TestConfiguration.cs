using Microsoft.Extensions.Configuration;

namespace NookBook.API.Tests.Helpers;

public static class TestConfiguration
{
    public const string JwtSecret = "nookbook-super-secret-jwt-key-must-be-at-least-32-characters-long";

    public static IConfiguration Create() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = JwtSecret,
                ["Jwt:Issuer"] = "NookBookTest",
                ["Jwt:Audience"] = "NookBookTestClient",
                ["EmailSettings:SmtpServer"] = "localhost",
                ["EmailSettings:SmtpPort"] = "25",
                ["EmailSettings:SenderEmail"] = "",
                ["EmailSettings:SenderPassword"] = ""
            })
            .Build();
}
