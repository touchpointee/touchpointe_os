using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Touchpointe.API.Controllers
{
    [ApiController]
    public abstract class BaseController : ControllerBase
    {
        protected Guid GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(idClaim) || !Guid.TryParse(idClaim, out var userId))
            {
                 throw new UnauthorizedAccessException("User ID is missing or invalid in the token.");
            }
            
            return userId;
        }
    }
}
