using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using NookBook.API.Tests.Helpers;

namespace NookBook.API.Tests.Integration;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"NookBookTestDb_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TestDatabaseName"] = _databaseName,
                ["Jwt:Secret"] = TestConfiguration.JwtSecret,
                ["Jwt:Issuer"] = "NookBookAPI",
                ["Jwt:Audience"] = "NookBookClient",
                ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test",
                ["EmailSettings:SenderEmail"] = "",
                ["EmailSettings:SenderPassword"] = ""
            });
        });
    }
}
