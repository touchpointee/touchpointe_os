using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Touchpointe.Application.Common.Interfaces;

namespace Touchpointe.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid? UserId
        {
            get
            {
                var id = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                return id == null ? null : Guid.Parse(id);
            }
        }
    }
}
