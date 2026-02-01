using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Auth.Commands.Login;
using Touchpointe.Application.Auth.Commands.Register;
using Touchpointe.Application.Auth.Commands.GoogleLogin;
using Touchpointe.Application.Common.Authentication;
using Touchpointe.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [EnableRateLimiting("AuthLimiter")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;
        private readonly IApplicationDbContext _context;

        public AuthController(IAuthenticationService authenticationService, IApplicationDbContext context)
        {
            _authenticationService = authenticationService;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthenticationResult>> Register(RegisterCommand request)
        {
            try 
            {
                var result = await _authenticationService.Register(request);
                SetTokenCookie(result.Token);
                return Ok(new 
                {
                    result.Id,
                    result.FullName,
                    result.Email,
                    result.LastActiveWorkspaceId
                });
            }
            catch (Exception ex)
            {
                // Simple error handling for now
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthenticationResult>> Login(LoginCommand request)
        {
            try
            {
                var result = await _authenticationService.Login(request);
                SetTokenCookie(result.Token);
                return Ok(new 
                {
                    result.Id,
                    result.FullName,
                    result.Email,
                    result.LastActiveWorkspaceId
                });
            }
            catch (Exception ex)
            {
                 return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("google")]
        public async Task<ActionResult<AuthenticationResult>> GoogleLogin([FromBody] GoogleLoginCommand request)
        {
            try
            {
                var result = await _authenticationService.GoogleLogin(request);
                SetTokenCookie(result.Token);
                return Ok(new
                {
                    result.Id,
                    result.FullName,
                    result.Email,
                    result.LastActiveWorkspaceId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt", new CookieOptions 
            { 
                HttpOnly = true, 
                Secure = true, 
                SameSite = SameSiteMode.Strict 
            });
            return Ok(new { message = "Logged out" });
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Keep Secure=true, localhost usually supports it. If issues persist, make dynamic.
                SameSite = SameSiteMode.None, // Allow Cross-Origin (Port) cookies
                Expires = DateTime.UtcNow.AddHours(2) 
            };
            Response.Cookies.Append("jwt", token, cookieOptions);
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<object>> Me()
        {
            try
            {
                var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
                
                if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
                {
                    return Unauthorized();
                }

                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                
                if (user == null)
                {
                    return Unauthorized();
                }

                return Ok(new 
                {
                    id = user.Id,
                    email = user.Email,
                    fullName = user.FullName,
                    username = user.Email, 
                    avatarUrl = user.AvatarUrl ?? "",
                    lastActiveWorkspaceId = user.LastActiveWorkspaceId
                });
            }
            catch
            {
                return Unauthorized();
            }
        }
    }
}
