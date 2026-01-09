using Microsoft.EntityFrameworkCore;
using Touchpointe.Application.Common.Interfaces;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Services.Invitations
{
    public class InvitationService : IInvitationService
    {
        private readonly IApplicationDbContext _context;

        public InvitationService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> CreateInvitationAsync(Guid inviterId, Guid workspaceId, string email, WorkspaceRole role)
        {
            // 1. Check if user is already a member (if user exists with that email)
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user != null)
            {
                var isMember = await _context.WorkspaceMembers
                    .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == user.Id);
                
                if (isMember)
                {
                    throw new Exception("User is already a member of this workspace.");
                }
            }

            // 2. Check if pending invitation exists
            var existing = await _context.WorkspaceInvitations
                .FirstOrDefaultAsync(i => i.WorkspaceId == workspaceId && i.Email == email && i.Status == InvitationStatus.PENDING);

            if (existing != null)
            {
                if (existing.ExpiresAt < DateTime.UtcNow)
                {
                    // Expired, mark as such
                    existing.Status = InvitationStatus.EXPIRED;
                } 
                else 
                {
                    return existing.Id; // Return existing valid invitation
                }
            }

            // 3. Create
            var invitation = new WorkspaceInvitation
            {
                WorkspaceId = workspaceId,
                InviterId = inviterId,
                Email = email,
                Role = role,
                Status = InvitationStatus.PENDING,
                Token = Guid.NewGuid().ToString("N"),
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.WorkspaceInvitations.Add(invitation);
            await _context.SaveChangesAsync(CancellationToken.None);

            return invitation.Id;
        }

        public async Task<Guid> CreateInvitationByUsernameAsync(Guid inviterId, Guid workspaceId, string username, WorkspaceRole role)
        {
            // Resolve username to user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
            {
                throw new Exception($"User with username '{username}' not found.");
            }

            // Check if already a member
            var isMember = await _context.WorkspaceMembers
                .AnyAsync(m => m.WorkspaceId == workspaceId && m.UserId == user.Id);
            if (isMember)
            {
                throw new Exception("User is already a member of this workspace.");
            }

            // Check for existing pending invitation (by user_id, not username)
            var existing = await _context.WorkspaceInvitations
                .FirstOrDefaultAsync(i => i.WorkspaceId == workspaceId && i.InviteeId == user.Id && i.Status == InvitationStatus.PENDING);

            if (existing != null)
            {
                if (existing.ExpiresAt < DateTime.UtcNow)
                {
                    existing.Status = InvitationStatus.EXPIRED;
                }
                else
                {
                    return existing.Id;
                }
            }

            // Create invitation linked to user_id (not username string)
            var invitation = new WorkspaceInvitation
            {
                WorkspaceId = workspaceId,
                InviterId = inviterId,
                InviteeId = user.Id, // Store resolved user_id
                Email = user.Email, // Store email for reference
                Username = username, // Store for display only
                Role = role,
                Status = InvitationStatus.PENDING,
                Token = Guid.NewGuid().ToString("N"),
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.WorkspaceInvitations.Add(invitation);
            await _context.SaveChangesAsync(CancellationToken.None);

            return invitation.Id;
        }

        public async Task AcceptInvitationAsync(string token, Guid userId)
        {
            var invitation = await _context.WorkspaceInvitations
                .FirstOrDefaultAsync(i => i.Token == token);

            if (invitation == null) throw new Exception("Invitation not found.");
            if (invitation.Status != InvitationStatus.PENDING) throw new Exception($"Invitation is {invitation.Status}.");
            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                invitation.Status = InvitationStatus.EXPIRED;
                await _context.SaveChangesAsync(CancellationToken.None);
                throw new Exception("Invitation expired.");
            }

            // Verify user match if email logic is strict, or allow any logged in user?
            // "Resolve invitation by user_id" -> User clicks link w/ token.
            // Strict security: Check if logged in user's email matches invitation email.
            var user = await _context.Users.FindAsync(userId);
            if (user == null) throw new Exception("User not found.");

            // Optional: Match emails
            if (!string.IsNullOrEmpty(invitation.Email) && !string.Equals(user.Email, invitation.Email, StringComparison.OrdinalIgnoreCase))
            {
                 // Allow mismatch? Usually safer to block. But user might use aliases.
                 // Requirement: "Resolve invitation by user_id (not username string)".
                 // I will enforce Email match to prevent token hijacking logic, or just assume token possession is enough.
                 // For safety, I'll enforce email match if invitation has email.
                 if (invitation.Email != user.Email) 
                 {
                     // WARN: Mismatch. For now throwing.
                     throw new Exception("Invitation email does not match logged in user.");
                 }
            }

            // Create Member
            var member = new WorkspaceMember
            {
                UserId = userId,
                WorkspaceId = invitation.WorkspaceId,
                Role = invitation.Role,
                JoinedAt = DateTime.UtcNow
            };

            _context.WorkspaceMembers.Add(member);
            invitation.Status = InvitationStatus.ACCEPTED;

            await _context.SaveChangesAsync(CancellationToken.None);
        }

        public async Task RejectInvitationAsync(string token)
        {
             var invitation = await _context.WorkspaceInvitations.FirstOrDefaultAsync(i => i.Token == token);
             if (invitation == null) return; 

             invitation.Status = InvitationStatus.REJECTED;
             await _context.SaveChangesAsync(CancellationToken.None);
        }

        public async Task<List<WorkspaceInvitation>> GetPendingInvitationsAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return new List<WorkspaceInvitation>();

            return await _context.WorkspaceInvitations
                .Include(i => i.Workspace)
                .Include(i => i.Inviter)
                .Where(i => i.Email == user.Email && i.Status == InvitationStatus.PENDING && i.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();
        }
    }
}
