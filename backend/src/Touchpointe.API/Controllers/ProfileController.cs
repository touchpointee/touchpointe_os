using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    [Route("api/profile")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IApplicationDbContext _context;

        public ProfileController(IApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ProfileDto>> GetProfile()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            return Ok(new ProfileDto(user.Id, user.Email, user.Username, user.FullName, user.AvatarUrl));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // Update username with uniqueness check
            if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
            {
                var exists = await _context.Users.AnyAsync(u => u.Username == request.Username && u.Id != userId);
                if (exists)
                {
                    return BadRequest(new { error = "Username already taken" });
                }
                user.Username = request.Username;
            }

            // Update full name
            if (!string.IsNullOrEmpty(request.FullName))
            {
                user.FullName = request.FullName;
            }

            await _context.SaveChangesAsync(CancellationToken.None);

            return Ok(new ProfileDto(user.Id, user.Email, user.Username, user.FullName, user.AvatarUrl));
        }
    }
}
