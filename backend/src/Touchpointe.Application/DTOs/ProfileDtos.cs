namespace Touchpointe.Application.DTOs
{
    public record UpdateProfileRequest(string? Username, string? FullName);

    public record ProfileDto(Guid Id, string Email, string Username, string FullName, string AvatarUrl);
}
