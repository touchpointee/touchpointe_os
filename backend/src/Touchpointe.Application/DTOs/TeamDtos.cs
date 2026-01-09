using System;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.DTOs
{
    public record TeamMemberDto(
        Guid MemberId,
        Guid UserId,
        string FullName,
        string Email,
        string? AvatarUrl,
        WorkspaceRole Role,
        DateTime JoinedAt
    );

    public class InviteMemberRequest
    {
        public string EmailOrUsername { get; set; } = string.Empty;
        public WorkspaceRole Role { get; set; } = WorkspaceRole.MEMBER;
    }

    public class UpdateRoleRequest
    {
        public WorkspaceRole NewRole { get; set; }
    }
}
