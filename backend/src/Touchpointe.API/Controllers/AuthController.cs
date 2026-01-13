using Microsoft.AspNetCore.Mvc;
using Touchpointe.Application.Auth.Commands.Login;
using Touchpointe.Application.Auth.Commands.Register;
using Touchpointe.Application.Common.Authentication;
using Touchpointe.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
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
                return Ok(result);
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
                return Ok(result);
            }
            catch (Exception ex)
            {
                 return BadRequest(new { error = ex.Message });
            }
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
