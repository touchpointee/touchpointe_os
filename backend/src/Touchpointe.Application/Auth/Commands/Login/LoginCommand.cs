using Touchpointe.Application.Common.Authentication;

namespace Touchpointe.Application.Auth.Commands.Login
{
    public record LoginCommand(
        string Email,
        string Password);
}
