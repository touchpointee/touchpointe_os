using Touchpointe.Application.Auth.Commands.Register;
using Touchpointe.Application.Auth.Commands.Login;
using Touchpointe.Application.Common.Authentication;

using Touchpointe.Application.Auth.Commands.GoogleLogin;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IAuthenticationService
    {
        Task<AuthenticationResult> Register(RegisterCommand command);
        Task<AuthenticationResult> Login(LoginCommand command);
        Task<AuthenticationResult> GoogleLogin(GoogleLoginCommand command);
    }
}
