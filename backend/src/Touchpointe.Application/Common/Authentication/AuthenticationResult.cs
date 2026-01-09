namespace Touchpointe.Application.Common.Authentication
{
    public record AuthenticationResult(
        Guid Id,
        string FullName,
        string Email,
        string Token);
}
