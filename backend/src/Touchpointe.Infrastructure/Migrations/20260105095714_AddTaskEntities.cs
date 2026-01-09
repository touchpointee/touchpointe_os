using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InviteeId",
                table: "WorkspaceInvitations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FolderId",
                table: "Lists",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrderIndex",
                table: "Lists",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Folders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    SpaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Folders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Folders_Spaces_SpaceId",
                        column: x => x.SpaceId,
                        principalTable: "Spaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Folders_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    AssigneeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Lists_ListId",
                        column: x => x.ListId,
                        principalTable: "Lists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tasks_Users_AssigneeId",
                        column: x => x.AssigneeId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tasks_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tasks_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityType = table.Column<int>(type: "integer", nullable: false),
                    OldValue = table.Column<string>(type: "text", nullable: true),
                    NewValue = table.Column<string>(type: "text", nullable: true),
                    ChangedById = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskActivities_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskActivities_Users_ChangedById",
                        column: x => x.ChangedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceInvitations_InviteeId",
                table: "WorkspaceInvitations",
                column: "InviteeId");

            migrationBuilder.CreateIndex(
                name: "IX_Lists_FolderId",
                table: "Lists",
                column: "FolderId");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_SpaceId",
                table: "Folders",
                column: "SpaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_WorkspaceId",
                table: "Folders",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskActivities_ChangedById",
                table: "TaskActivities",
                column: "ChangedById");

            migrationBuilder.CreateIndex(
                name: "IX_TaskActivities_TaskId",
                table: "TaskActivities",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AssigneeId",
                table: "Tasks",
                column: "AssigneeId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_CreatedById",
                table: "Tasks",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ListId",
                table: "Tasks",
                column: "ListId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_WorkspaceId",
                table: "Tasks",
                column: "WorkspaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lists_Folders_FolderId",
                table: "Lists",
                column: "FolderId",
                principalTable: "Folders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceInvitations_Users_InviteeId",
                table: "WorkspaceInvitations",
                column: "InviteeId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lists_Folders_FolderId",
                table: "Lists");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceInvitations_Users_InviteeId",
                table: "WorkspaceInvitations");

            migrationBuilder.DropTable(
                name: "Folders");

            migrationBuilder.DropTable(
                name: "TaskActivities");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceInvitations_InviteeId",
                table: "WorkspaceInvitations");

            migrationBuilder.DropIndex(
                name: "IX_Lists_FolderId",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "InviteeId",
                table: "WorkspaceInvitations");

            migrationBuilder.DropColumn(
                name: "FolderId",
                table: "Lists");

            migrationBuilder.DropColumn(
                name: "OrderIndex",
                table: "Lists");
        }
    }
}
