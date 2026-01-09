using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Application.DTOs;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Team
{
    public class TeamService : ITeamService
    {
        private readonly IApplicationDbContext _context;

        public TeamService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TeamMemberDto>> GetMembersAsync(Guid workspaceId, Guid currentUserId)
        {
            // Verify current user membership
            var isMember = await _context.WorkspaceMembers
                .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (!isMember) throw new UnauthorizedAccessException("Not a member of this workspace");

            return await _context.WorkspaceMembers
                .Include(m => m.User)
                .Where(m => m.WorkspaceId == workspaceId)
                .OrderBy(m => m.User.FullName)
                .Select(m => new TeamMemberDto(
                    m.Id,
                    m.UserId,
                    m.User.FullName,
                    m.User.Email,
                    m.User.AvatarUrl,
                    m.Role,
                    m.JoinedAt
                ))
                .ToListAsync();
        }

        public async Task<bool> InviteMemberAsync(Guid workspaceId, Guid currentUserId, InviteMemberRequest request)
        {
            // Security: Only Owner/Admin
            var inviter = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (inviter == null) throw new UnauthorizedAccessException("Not a member");
            if (inviter.Role != WorkspaceRole.OWNER && inviter.Role != WorkspaceRole.ADMIN)
                throw new UnauthorizedAccessException("Only Owners and Admins can invite members");

            // Resolve Invitee
            User? invitee = null;
            if (request.EmailOrUsername.Contains("@"))
            {
                invitee = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.EmailOrUsername);
                if (invitee == null) 
                    throw new Exception("User not registered");
            }
            else
            {
                invitee = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.EmailOrUsername);
                if (invitee == null)
                    throw new Exception("User with this username not found");
            }

            Guid? inviteeId = invitee?.Id;

            // Check if already member
            if (inviteeId.HasValue)
            {
                var exists = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == inviteeId.Value);
                if (exists) throw new Exception("User is already a member");
            }

            // Check pending invites (by email)
            var pending = await _context.WorkspaceInvitations
                .AnyAsync(i => i.WorkspaceId == workspaceId && 
                               i.Status == InvitationStatus.PENDING && 
                               (i.Email == request.EmailOrUsername || (inviteeId.HasValue && i.InviteeId == inviteeId.Value)));
            
            if (pending) throw new Exception("Invitation already pending");

            // Create Invitation
            var invitation = new WorkspaceInvitation
            {
                WorkspaceId = workspaceId,
                InviterId = currentUserId,
                InviteeId = inviteeId,
                Email = request.EmailOrUsername.Contains("@") ? request.EmailOrUsername : null,
                Username = !request.EmailOrUsername.Contains("@") ? request.EmailOrUsername : null,
                Role = request.Role,
                Status = InvitationStatus.PENDING,
                Token = Guid.NewGuid().ToString(), // Simple token
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.WorkspaceInvitations.Add(invitation);
            await _context.SaveChangesAsync(CancellationToken.None);

            // Notification (Logic placeholder as per Non-Goals, no UI push, just DB record if Notifications existed)

            return true;
        }

        public async Task<bool> UpdateMemberRoleAsync(Guid workspaceId, Guid currentUserId, Guid memberId, WorkspaceRole newRole)
        {
            // Security: Only Owner/Admin
            var currentUserMember = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (currentUserMember == null || (currentUserMember.Role != WorkspaceRole.OWNER && currentUserMember.Role != WorkspaceRole.ADMIN))
                throw new UnauthorizedAccessException("Insufficient permissions");

            var targetMember = await _context.WorkspaceMembers.FindAsync(memberId);
            if (targetMember == null || targetMember.WorkspaceId != workspaceId) throw new Exception("Member not found");

            // Rule: Cannot change Owner's role
            if (targetMember.Role == WorkspaceRole.OWNER)
                throw new InvalidOperationException("Cannot change the role of the Workspace Owner");

            // Rule: Admins cannot promote/demote other Admins effectively if we want strict hierarchy?
            // Spec: "ADMIN: invite/manage members". "Owner: full access".
            // Let's allow Admin to change Member/Viewer. Prevent Admin from touching Admin? Or limit Admin from assigning Owner?
            // User Review says: "Self-escalation... blocked". "ADMIN... cannot touch Owner".
            
            if (currentUserMember.Role == WorkspaceRole.ADMIN && (targetMember.Role == WorkspaceRole.ADMIN || targetMember.Role == WorkspaceRole.OWNER))
                throw new UnauthorizedAccessException("Admins cannot modify other Admins or Owners");

            if (currentUserMember.Role == WorkspaceRole.ADMIN && newRole == WorkspaceRole.OWNER)
                throw new UnauthorizedAccessException("Admins cannot assign Owner role");
            
            // Allow Owner to do anything (except maybe demote themselves if they are the ONLY owner, but logic usually handled elsewhere. Here just update).
            
            targetMember.Role = newRole;
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        public async Task<bool> RemoveMemberAsync(Guid workspaceId, Guid currentUserId, Guid memberId)
        {
             // Security: Only Owner/Admin
            var currentUserMember = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (currentUserMember == null || (currentUserMember.Role != WorkspaceRole.OWNER && currentUserMember.Role != WorkspaceRole.ADMIN))
                throw new UnauthorizedAccessException("Insufficient permissions");

            var targetMember = await _context.WorkspaceMembers.FindAsync(memberId);
            if (targetMember == null || targetMember.WorkspaceId != workspaceId) throw new Exception("Member not found");

            // Rule: Cannot remove Owner
            if (targetMember.Role == WorkspaceRole.OWNER)
                throw new InvalidOperationException("Cannot remove the Workspace Owner");

            // Rule: Admin cannot remove Admin
            if (currentUserMember.Role == WorkspaceRole.ADMIN && targetMember.Role == WorkspaceRole.ADMIN)
                throw new UnauthorizedAccessException("Admins cannot remove other Admins");

            _context.WorkspaceMembers.Remove(targetMember);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }
        public async Task<WorkspaceDto> AcceptInvitationAsync(string token, Guid userId)
        {
            // Find Invitation
            var invitation = await _context.WorkspaceInvitations
                .Include(i => i.Workspace)
                .FirstOrDefaultAsync(i => i.Token == token && i.Status == InvitationStatus.PENDING);

            if (invitation == null) throw new Exception("Invalid or expired invitation");
            
            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                invitation.Status = InvitationStatus.EXPIRED;
                await _context.SaveChangesAsync(CancellationToken.None);
                throw new Exception("Invitation has expired");
            }

            // Verify User specific (if email matches, optional security but good)
            // If Invitation.Email is set, ideally we check against User.Email.
            // But User might change email? Let's assume we trust the token bearer if they are logged in.
            // However, strict security would verify email match.
            // Let's implement basics: Just Token for now. 

            // Check if already a member
            var existingMember = await _context.WorkspaceMembers
                .AnyAsync(m => m.WorkspaceId == invitation.WorkspaceId && m.UserId == userId);
            
            if (existingMember)
            {
                // Already member, just mark accepted return workspace
                invitation.Status = InvitationStatus.ACCEPTED;
                invitation.InviteeId = userId; // Bind to user
                await _context.SaveChangesAsync(CancellationToken.None);
            }
            else
            {
                // Add Member
                _context.WorkspaceMembers.Add(new WorkspaceMember
                {
                    WorkspaceId = invitation.WorkspaceId,
                    UserId = userId,
                    Role = invitation.Role
                });

                // Update Invitation
                invitation.Status = InvitationStatus.ACCEPTED;
                invitation.InviteeId = userId;
                
                await _context.SaveChangesAsync(CancellationToken.None);
                
                // Add to #general channel? 
                // Requirement: "Auto-create #general channel" (done elsewhere).
                // Requirement: "On join... can access modules".
                // Chat auto-join usually happens when visiting or explicit join.
                // But for #general, it's nice to auto-join.
                // Let's check if #general exists and add them.
                var generalChannel = await _context.Channels
                    .FirstOrDefaultAsync(c => c.WorkspaceId == invitation.WorkspaceId && c.Name == "general");
                
                if (generalChannel != null)
                {
                     _context.ChannelMembers.Add(new ChannelMember
                     {
                         WorkspaceId = invitation.WorkspaceId,
                         ChannelId = generalChannel.Id,
                         UserId = userId
                     });
                     await _context.SaveChangesAsync(CancellationToken.None);
                }
            }

            return new WorkspaceDto(
                invitation.Workspace.Id,
                invitation.Workspace.Name,
                invitation.Workspace.Slug,
                invitation.Role
            );
        }

        public async Task<List<WorkspaceInvitation>> GetWorkspaceInvitationsAsync(Guid workspaceId, Guid currentUserId)
        {
            // Security: Only Owner/Admin can view invitations
            var currentUserMember = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (currentUserMember == null || (currentUserMember.Role != WorkspaceRole.OWNER && currentUserMember.Role != WorkspaceRole.ADMIN))
                throw new UnauthorizedAccessException("Insufficient permissions");

            return await _context.WorkspaceInvitations
                .Include(i => i.Inviter)
                //.OrderByDescending(i => i.CreatedAt) // CreatedAt might not exist on Entity based on previous reads.
                .Where(i => i.WorkspaceId == workspaceId && i.Status == InvitationStatus.PENDING)
                .ToListAsync();
        }

        public async Task<bool> RevokeInvitationAsync(Guid workspaceId, Guid currentUserId, Guid invitationId)
        {
            // Security: Only Owner/Admin
            var currentUserMember = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (currentUserMember == null || (currentUserMember.Role != WorkspaceRole.OWNER && currentUserMember.Role != WorkspaceRole.ADMIN))
                throw new UnauthorizedAccessException("Insufficient permissions");

            var invitation = await _context.WorkspaceInvitations.FindAsync(invitationId);
            if (invitation == null) throw new Exception("Invitation not found");
            if (invitation.WorkspaceId != workspaceId) throw new Exception("Invitation does not belong to this workspace");

            // Hard delete or Mark as Revoked?
            // "Revoke invite" usually means delete or cancel.
            // Let's remove it to keep it clean, or update status to REVOKED if enum exists.
            // Checking enum... previous file view shows PENDING, ACCEPTED, REJECTED, EXPIRED.
            // Probably safe to just Delete for now, or add REVOKED.
            // Let's just DELETE for simplicity as "Revoke" implies it's gone.
            
            _context.WorkspaceInvitations.Remove(invitation);
            await _context.SaveChangesAsync(CancellationToken.None);
            return true;
        }

        public async Task<bool> ResendInvitationAsync(Guid workspaceId, Guid currentUserId, Guid invitationId)
        {
             // Security: Only Owner/Admin
            var currentUserMember = await _context.WorkspaceMembers
                .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == currentUserId);

            if (currentUserMember == null || (currentUserMember.Role != WorkspaceRole.OWNER && currentUserMember.Role != WorkspaceRole.ADMIN))
                throw new UnauthorizedAccessException("Insufficient permissions");

            var invitation = await _context.WorkspaceInvitations.FindAsync(invitationId);
            if (invitation == null) throw new Exception("Invitation not found");
            if (invitation.WorkspaceId != workspaceId) throw new Exception("Invitation does not belong to this workspace");

            // Extend Expiration
            invitation.ExpiresAt = DateTime.UtcNow.AddDays(7);
            invitation.Status = InvitationStatus.PENDING; // Reactivate if expired
            
            await _context.SaveChangesAsync(CancellationToken.None);
            
            // Notification (Mock)
            // Send email logic would go here.
            
            return true;
        }
    }
}
