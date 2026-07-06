namespace NookBook.API.DTOs;

public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

public class VerifyCodeDto
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class ResetPasswordDto
{
    public string ResetToken { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
