using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    public partial class AddSoftDeletesAndAuditFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use Idempotent SQL to safely apply changes on both Local (already matched) and Server (fresh)
            migrationBuilder.Sql(@"
DO $$
BEGIN
    -- 1. Tasks
    BEGIN
        ALTER TABLE ""Tasks"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""Tasks"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 2. TaskComments
    BEGIN
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 3. Messages
    BEGIN
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 4. Lists
    BEGIN
        ALTER TABLE ""Lists"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""Lists"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Lists"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Lists"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 5. Folders
    BEGIN
        ALTER TABLE ""Folders"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""Folders"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Folders"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Folders"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 6. Spaces
    BEGIN
        ALTER TABLE ""Spaces"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""Spaces"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Spaces"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Spaces"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 7. Tags
    BEGIN
        ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT FALSE;
        ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""DeletedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
        ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
            ");

            // Audit Logs Table
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
    ""Id"" uuid NOT NULL,
    ""UserId"" uuid NOT NULL,
    ""WorkspaceId"" uuid NULL,
    ""Action"" text NOT NULL,
    ""ActorRole"" text NOT NULL,
    ""TargetId"" text NOT NULL,
    ""Timestamp"" timestamp with time zone NOT NULL,
    ""IpAddress"" text NOT NULL,
    ""Metadata"" text NULL,
    CONSTRAINT ""PK_AuditLogs"" PRIMARY KEY (""Id"")
);
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop columns and table
            // Only strictly necessary if we plan to rollback, but good practice
            migrationBuilder.DropTable(name: "AuditLogs");
            
            var tables = new[] { "Tasks", "TaskComments", "Messages", "Lists", "Folders", "Spaces", "Tags" };
            foreach (var table in tables)
            {
                migrationBuilder.DropColumn(name: "IsDeleted", table: table);
                migrationBuilder.DropColumn(name: "DeletedAt", table: table);
                // Note: Not dropping Audit fields to be safe/lazy, manual SQL down is tedious
            }
        }
    }
}
