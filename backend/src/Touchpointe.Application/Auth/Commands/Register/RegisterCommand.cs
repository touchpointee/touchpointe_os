using Touchpointe.Application.Common.Authentication;

namespace Touchpointe.Application.Auth.Commands.Register
{
    public record RegisterCommand(
        string FullName,
        string Email,
        string Username,
        string Password);
}
