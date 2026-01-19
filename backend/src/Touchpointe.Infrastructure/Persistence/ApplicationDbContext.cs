using Microsoft.EntityFrameworkCore;
using Touchpointe.Domain.Entities;

using Touchpointe.Domain.Common;
using Touchpointe.Application.Common.Interfaces;
using System.Reflection;
using System.Linq.Expressions;

namespace Touchpointe.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries<ISoftDelete>())
            {
                if (entry.State == EntityState.Deleted)
                {
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = DateTime.UtcNow;
                }
            }
            return await base.SaveChangesAsync(cancellationToken);
        }

        private static void SetGlobalQueryFilter<T>(ModelBuilder builder) where T : class, ISoftDelete
        {
            builder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Workspace> Workspaces { get; set; }
        public DbSet<WorkspaceMember> WorkspaceMembers { get; set; }
        public DbSet<WorkspaceInvitation> WorkspaceInvitations { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Space> Spaces { get; set; }
        public DbSet<Folder> Folders { get; set; }
        public DbSet<TaskList> TaskLists { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskActivity> TaskActivities { get; set; }
        public DbSet<Subtask> Subtasks => Set<Subtask>();
        public DbSet<TaskWatcher> TaskWatchers => Set<TaskWatcher>();
        public DbSet<TaskMention> TaskMentions => Set<TaskMention>();
        public DbSet<TaskComment> TaskComments => Set<TaskComment>();
        public DbSet<CommentMention> CommentMentions => Set<CommentMention>();
        public DbSet<ChatMention> ChatMentions => Set<ChatMention>();
        public DbSet<Channel> Channels { get; set; }
        public DbSet<ChannelMember> ChannelMembers { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<MessageReaction> MessageReactions { get; set; }
        public DbSet<DirectMessageGroup> DirectMessageGroups { get; set; }
        public DbSet<DirectMessageMember> DirectMessageMembers { get; set; }

        public DbSet<Company> Companies { get; set; }
        public DbSet<Contact> Contacts { get; set; }
        public DbSet<Deal> Deals { get; set; }
        public DbSet<DealContact> DealContacts => Set<DealContact>();
        public DbSet<CrmActivity> CrmActivities => Set<CrmActivity>();
        public DbSet<AiChatMessage> AiChatMessages => Set<AiChatMessage>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        public DbSet<Meeting> Meetings => Set<Meeting>();
        public DbSet<MeetingParticipant> MeetingParticipants => Set<MeetingParticipant>();
        public DbSet<MeetingSession> MeetingSessions => Set<MeetingSession>();
        public DbSet<ListStatus> ListStatuses => Set<ListStatus>();
        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<TaskTimeEntry> TaskTimeEntries => Set<TaskTimeEntry>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Global Query Filter for Soft Deletes
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
                {
                    var method = typeof(ApplicationDbContext)
                        .GetMethod(nameof(SetGlobalQueryFilter), BindingFlags.NonPublic | BindingFlags.Static)
                        ?.MakeGenericMethod(entityType.ClrType);
                    method?.Invoke(null, new object[] { modelBuilder });
                }
            }

            // User
            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Workspace
            modelBuilder.Entity<Workspace>()
                .HasIndex(w => w.Slug)
                .IsUnique();

            modelBuilder.Entity<Workspace>()
                .HasOne(w => w.Owner)
                .WithMany()
                .HasForeignKey(w => w.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            // WorkspaceMember
            modelBuilder.Entity<WorkspaceMember>()
                .HasIndex(wm => new { wm.WorkspaceId, wm.UserId })
                .IsUnique();

            modelBuilder.Entity<WorkspaceMember>()
                .HasOne(wm => wm.Workspace)
                .WithMany()
                .HasForeignKey(wm => wm.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkspaceMember>()
                .HasOne(wm => wm.User)
                .WithMany()
                .HasForeignKey(wm => wm.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // WorkspaceInvitation
            modelBuilder.Entity<WorkspaceInvitation>()
                .HasIndex(wi => wi.Token)
                .IsUnique();
                
            modelBuilder.Entity<WorkspaceInvitation>()
                .HasOne(wi => wi.Workspace)
                .WithMany()
                .HasForeignKey(wi => wi.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<WorkspaceInvitation>()
                .HasOne(wi => wi.Inviter)
                .WithMany()
                .HasForeignKey(wi => wi.InviterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Space
            modelBuilder.Entity<Space>()
                .HasOne(s => s.Workspace)
                .WithMany()
                .HasForeignKey(s => s.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<Space>()
                .HasIndex(s => s.WorkspaceId);

            // Folder
            modelBuilder.Entity<Folder>()
                .HasOne(f => f.Workspace)
                .WithMany()
                .HasForeignKey(f => f.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Folder>()
                .HasOne(f => f.Space)
                .WithMany(s => s.Folders)
                .HasForeignKey(f => f.SpaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Folder>()
                .HasIndex(f => f.SpaceId);

            // TaskList (mapped to table "lists")
            modelBuilder.Entity<TaskList>()
                .ToTable("Lists")
                .HasOne(t => t.Workspace)
                .WithMany()
                .HasForeignKey(t => t.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<TaskList>()
                .HasOne(t => t.Space)
                .WithMany(s => s.Lists)
                .HasForeignKey(t => t.SpaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskList>()
                .HasOne(t => t.Folder)
                .WithMany(f => f.Lists)
                .HasForeignKey(t => t.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

             modelBuilder.Entity<TaskList>()
                .HasIndex(t => t.WorkspaceId);

            // Channel
            modelBuilder.Entity<Channel>()
                .HasOne(c => c.Workspace)
                .WithMany()
                .HasForeignKey(c => c.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Channel>()
                .HasIndex(c => c.WorkspaceId);

            // Task (mapped to table "tasks")
            modelBuilder.Entity<TaskItem>()
                .ToTable("Tasks")
                .HasOne(t => t.Workspace)
                .WithMany()
                .HasForeignKey(t => t.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.List)
                .WithMany()
                .HasForeignKey(t => t.ListId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Assignee)
                .WithMany()
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

             modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskItem>()
                .HasMany(t => t.Tags)
                .WithMany(tg => tg.Tasks)
                .UsingEntity(j => j.ToTable("TaskTags"));

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.WorkspaceId);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.ListId);

            // TaskActivity
            modelBuilder.Entity<TaskActivity>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.Activities)
                .HasForeignKey(ta => ta.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskActivity>()
                .HasOne(ta => ta.ChangedBy)
                .WithMany()
                .HasForeignKey(ta => ta.ChangedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskActivity>()
                .HasIndex(ta => ta.TaskId);
            
            modelBuilder.Entity<TaskActivity>()
                .HasIndex(ta => new { ta.TaskId, ta.Timestamp });

            // Subtask
            modelBuilder.Entity<Subtask>()
                .HasOne(s => s.Task)
                .WithMany() // No navigation property on TaskItem yet, will add later or keep unidirectional
                .HasForeignKey(s => s.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Subtask>()
                .HasIndex(s => s.TaskId);

            // TaskComment
            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.Task)
                .WithMany()
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskComment>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskComment>()
                .HasIndex(c => c.TaskId);
            modelBuilder.Entity<TaskComment>()
                .HasIndex(c => c.TaskId);
            
            // TaskWatcher
            modelBuilder.Entity<TaskWatcher>()
                .HasKey(tw => new { tw.TaskId, tw.UserId });

            modelBuilder.Entity<TaskWatcher>()
                .HasOne(tw => tw.Task)
                .WithMany(t => t.Watchers)
                .HasForeignKey(tw => tw.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskWatcher>()
                .HasOne(tw => tw.User)
                .WithMany()
                .HasForeignKey(tw => tw.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // TaskMention
            modelBuilder.Entity<TaskMention>()
                .HasOne(tm => tm.Task)
                .WithMany(t => t.Mentions)
                .HasForeignKey(tm => tm.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<TaskMention>()
                .HasOne(tm => tm.User)
                .WithMany()
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<TaskMention>()
                .HasIndex(tm => tm.UserId);

            // CommentMention
            modelBuilder.Entity<CommentMention>()
                .HasOne(cm => cm.Comment)
                .WithMany(c => c.Mentions)
                .HasForeignKey(cm => cm.CommentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CommentMention>()
                .HasOne(cm => cm.User)
                .WithMany()
                .HasForeignKey(cm => cm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ChatMention
            modelBuilder.Entity<ChatMention>()
                .HasKey(cm => new { cm.MessageId, cm.UserId });

            modelBuilder.Entity<ChatMention>()
                .HasOne(cm => cm.Message)
                .WithMany(m => m.Mentions)
                .HasForeignKey(cm => cm.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMention>()
                .HasOne(cm => cm.User)
                .WithMany()
                .HasForeignKey(cm => cm.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<ChatMention>()
                .HasIndex(cm => cm.UserId);
            
            modelBuilder.Entity<CommentMention>()
                .HasIndex(cm => cm.UserId);
                
            // Schema drift protection: SourceUserId likely not in DB yet
            modelBuilder.Entity<ChatMention>().Ignore(cm => cm.SourceUserId);
            modelBuilder.Entity<ChatMention>().Ignore(cm => cm.SourceUser);

            // CRM: Company
            modelBuilder.Entity<Company>()
                .HasIndex(c => c.WorkspaceId);

            // CRM: Contact
            modelBuilder.Entity<Contact>()
                .HasOne(c => c.Company)
                .WithMany(co => co.Contacts)
                .HasForeignKey(c => c.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.WorkspaceId);

            // CRM: Deal
            modelBuilder.Entity<Deal>()
                .HasOne(d => d.Company)
                .WithMany(c => c.Deals)
                .HasForeignKey(d => d.CompanyId)
                .OnDelete(DeleteBehavior.SetNull);

            // CRM: DealContact (Many-to-Many)
            modelBuilder.Entity<DealContact>()
                .HasKey(dc => new { dc.DealId, dc.ContactId });

            modelBuilder.Entity<DealContact>()
                .HasOne(dc => dc.Deal)
                .WithMany(d => d.DealContacts)
                .HasForeignKey(dc => dc.DealId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DealContact>()
                .HasOne(dc => dc.Contact)
                .WithMany(c => c.DealContacts)
                .HasForeignKey(dc => dc.ContactId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Deal>()
                .HasIndex(d => d.WorkspaceId);

            // CRM: Activity
            modelBuilder.Entity<CrmActivity>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CrmActivity>()
                .HasIndex(a => a.WorkspaceId);
            
            modelBuilder.Entity<CrmActivity>()
                .HasIndex(a => new { a.EntityId, a.EntityType });
                
            // Chat: Channel (Existing config, enhancing)
            modelBuilder.Entity<Channel>()
                .HasOne(c => c.Workspace)
                .WithMany()
                .HasForeignKey(c => c.WorkspaceId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent accidental wipe if not cascaded

            modelBuilder.Entity<ChannelMember>()
                .HasOne(cm => cm.Channel)
                .WithMany(c => c.Members)
                .HasForeignKey(cm => cm.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<ChannelMember>()
                .HasOne(cm => cm.User)
                .WithMany()
                .HasForeignKey(cm => cm.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChannelMember>()
                .HasIndex(cm => new { cm.ChannelId, cm.UserId })
                .IsUnique();

            // Chat: Messages
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Channel)
                .WithMany(c => c.Messages)
                .HasForeignKey(m => m.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.DirectMessageGroup)
                .WithMany(g => g.Messages)
                .HasForeignKey(m => m.DirectMessageGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            
            modelBuilder.Entity<Message>()
                .HasIndex(m => m.ChannelId);
            modelBuilder.Entity<Message>()
                .HasIndex(m => m.DirectMessageGroupId);
            modelBuilder.Entity<Message>()
                .HasIndex(m => m.CreatedAt);
            modelBuilder.Entity<Message>()
                .HasIndex(m => m.WorkspaceId);
            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.ChannelId, m.CreatedAt });

            // Chat: Direct Messages
            modelBuilder.Entity<DirectMessageGroup>()
                .HasIndex(g => g.WorkspaceId);

            modelBuilder.Entity<DirectMessageMember>()
                .HasOne(dmm => dmm.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(dmm => dmm.DirectMessageGroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DirectMessageMember>()
                .HasOne(dmm => dmm.User)
                .WithMany()
                .HasForeignKey(dmm => dmm.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<DirectMessageMember>()
                .HasIndex(dmm => new { dmm.DirectMessageGroupId, dmm.UserId })
                .IsUnique();

            // Chat: Reactions
            modelBuilder.Entity<MessageReaction>()
                .HasOne(r => r.Message)
                .WithMany(m => m.Reactions)
                .HasForeignKey(r => r.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MessageReaction>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MessageReaction>()
                .HasIndex(r => new { r.MessageId, r.UserId, r.Emoji })
                .IsUnique();
            // AiChatMessage
            modelBuilder.Entity<AiChatMessage>()
                .HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Meeting
            modelBuilder.Entity<Meeting>()
                .HasIndex(m => m.JoinCode)
                .IsUnique();

            modelBuilder.Entity<Meeting>()
                .HasOne(m => m.Workspace)
                .WithMany()
                .HasForeignKey(m => m.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Meeting>()
                .HasOne(m => m.CreatedBy)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // MeetingParticipant
            modelBuilder.Entity<MeetingParticipant>()
                .HasOne(p => p.Meeting)
                .WithMany(m => m.Participants)
                .HasForeignKey(p => p.MeetingId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MeetingParticipant>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // MeetingSession
            modelBuilder.Entity<MeetingSession>()
                .HasOne(s => s.Participant)
                .WithMany(p => p.Sessions)
                .HasForeignKey(s => s.MeetingParticipantId)
                .OnDelete(DeleteBehavior.Cascade);

            // ListStatus - for database-driven status colors
            modelBuilder.Entity<ListStatus>()
                .ToTable("ListStatuses")
                .HasOne(s => s.List)
                .WithMany()
                .HasForeignKey(s => s.ListId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ListStatus>()
                .HasIndex(s => s.ListId);

            modelBuilder.Entity<ListStatus>()
                .Property(s => s.Color)
                .IsRequired();

            // Tags
            modelBuilder.Entity<Tag>()
                .HasIndex(t => t.WorkspaceId);

            modelBuilder.Entity<Tag>()
                .HasOne(t => t.Workspace)
                .WithMany()
                .HasForeignKey(t => t.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskTimeEntries
            modelBuilder.Entity<TaskTimeEntry>()
                .HasOne(t => t.Task)
                .WithMany(tk => tk.TimeEntries)
                .HasForeignKey(t => t.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskTimeEntry>()
                .HasOne(t => t.User)
                .WithMany() // User doesn't need nav prop back
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskTimeEntry>()
                .HasIndex(t => t.TaskId);
            modelBuilder.Entity<TaskTimeEntry>()
                .HasIndex(t => t.UserId);

            modelBuilder.Entity<TaskTimeEntry>()
                .HasIndex(t => new { t.UserId, t.EndTime });
        }
    }
}
