using Microsoft.EntityFrameworkCore;
using Touchpointe.Domain.Entities;

namespace Touchpointe.Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<User> Users { get; }
        DbSet<Workspace> Workspaces { get; }
        DbSet<WorkspaceMember> WorkspaceMembers { get; }
        DbSet<WorkspaceInvitation> WorkspaceInvitations { get; }
        DbSet<Notification> Notifications { get; }
        DbSet<Space> Spaces { get; }
        DbSet<Folder> Folders { get; }
        DbSet<TaskList> TaskLists { get; }
        DbSet<TaskItem> Tasks { get; }
        DbSet<TaskActivity> TaskActivities { get; }
        DbSet<Subtask> Subtasks { get; }
        DbSet<TaskComment> TaskComments { get; }
        DbSet<Channel> Channels { get; }
        DbSet<ChannelMember> ChannelMembers { get; }
        DbSet<Message> Messages { get; }
        DbSet<DirectMessageGroup> DirectMessageGroups { get; }
        DbSet<DirectMessageMember> DirectMessageMembers { get; }
        DbSet<MessageReaction> MessageReactions { get; }

        DbSet<Company> Companies { get; }
        DbSet<Contact> Contacts { get; }
        DbSet<Deal> Deals { get; }
        DbSet<DealContact> DealContacts { get; }
        DbSet<CrmActivity> CrmActivities { get; }
        DbSet<AiChatMessage> AiChatMessages { get; }
        
        DbSet<TaskWatcher> TaskWatchers { get; }
        DbSet<TaskMention> TaskMentions { get; }
        DbSet<CommentMention> CommentMentions { get; }
        DbSet<ChatMention> ChatMentions { get; }

        DbSet<Meeting> Meetings { get; }
        DbSet<MeetingParticipant> MeetingParticipants { get; }
        DbSet<MeetingSession> MeetingSessions { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
