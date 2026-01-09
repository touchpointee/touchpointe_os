using System;

namespace Touchpointe.Domain.Entities
{
    public enum CrmEntityType
    {
        COMPANY,
        CONTACT,
        DEAL
    }

    public enum CrmActionType
    {
        CREATED,
        UPDATED,
        DELETED,
        STAGE_CHANGED,
        VALUE_CHANGED,
        LINKED
    }

    public class CrmActivity
    {
        public Guid Id { get; set; }
        public Guid WorkspaceId { get; set; }
        public CrmEntityType EntityType { get; set; }
        public Guid EntityId { get; set; }
        public CrmActionType ActionType { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public User User { get; set; } = null!;
    }
}
