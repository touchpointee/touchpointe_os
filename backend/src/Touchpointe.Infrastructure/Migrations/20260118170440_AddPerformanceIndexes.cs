using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TaskItemId",
                table: "TaskComments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TaskItemId",
                table: "Subtasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskTimeEntries_UserId_EndTime",
                table: "TaskTimeEntries",
                columns: new[] { "UserId", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_TaskItemId",
                table: "TaskComments",
                column: "TaskItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskActivities_TaskId_Timestamp",
                table: "TaskActivities",
                columns: new[] { "TaskId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_TaskItemId",
                table: "Subtasks",
                column: "TaskItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ChannelId_CreatedAt",
                table: "Messages",
                columns: new[] { "ChannelId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Messages_WorkspaceId",
                table: "Messages",
                column: "WorkspaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Subtasks_Tasks_TaskItemId",
                table: "Subtasks",
                column: "TaskItemId",
                principalTable: "Tasks",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_Tasks_TaskItemId",
                table: "TaskComments",
                column: "TaskItemId",
                principalTable: "Tasks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subtasks_Tasks_TaskItemId",
                table: "Subtasks");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_Tasks_TaskItemId",
                table: "TaskComments");

            migrationBuilder.DropIndex(
                name: "IX_TaskTimeEntries_UserId_EndTime",
                table: "TaskTimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TaskComments_TaskItemId",
                table: "TaskComments");

            migrationBuilder.DropIndex(
                name: "IX_TaskActivities_TaskId_Timestamp",
                table: "TaskActivities");

            migrationBuilder.DropIndex(
                name: "IX_Subtasks_TaskItemId",
                table: "Subtasks");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ChannelId_CreatedAt",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_WorkspaceId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "TaskItemId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "TaskItemId",
                table: "Subtasks");
        }
    }
}
