using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface ITeamService
    {
        Task<List<TeamMemberDto>> GetMembersAsync(Guid workspaceId, Guid currentUserId);
        Task<bool> InviteMemberAsync(Guid workspaceId, Guid currentUserId, InviteMemberRequest request);
        Task<bool> UpdateMemberRoleAsync(Guid workspaceId, Guid currentUserId, Guid memberId, WorkspaceRole newRole);
        Task<bool> RemoveMemberAsync(Guid workspaceId, Guid currentUserId, Guid memberId);
        Task<WorkspaceDto> AcceptInvitationAsync(string token, Guid userId);
        Task<List<WorkspaceInvitation>> GetWorkspaceInvitationsAsync(Guid workspaceId, Guid currentUserId);
        Task<bool> RevokeInvitationAsync(Guid workspaceId, Guid currentUserId, Guid invitationId);
        Task<bool> ResendInvitationAsync(Guid workspaceId, Guid currentUserId, Guid invitationId);
    }
}
