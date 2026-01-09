using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IJwtTokenGenerator
    {
        string GenerateToken(User user);
    }
}
