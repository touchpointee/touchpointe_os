using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubDescriptionAndSubtaskAssignee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubDescription",
                table: "Tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssigneeId",
                table: "Subtasks",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Backfill existing subtasks with parent task assignee
            migrationBuilder.Sql(
                @"UPDATE ""Subtasks"" 
                  SET ""AssigneeId"" = ""Tasks"".""AssigneeId"" 
                  FROM ""Tasks"" 
                  WHERE ""Subtasks"".""TaskId"" = ""Tasks"".""Id""");

            migrationBuilder.CreateIndex(
                name: "IX_Subtasks_AssigneeId",
                table: "Subtasks",
                column: "AssigneeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Subtasks_Users_AssigneeId",
                table: "Subtasks",
                column: "AssigneeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subtasks_Users_AssigneeId",
                table: "Subtasks");

            migrationBuilder.DropIndex(
                name: "IX_Subtasks_AssigneeId",
                table: "Subtasks");

            migrationBuilder.DropColumn(
                name: "SubDescription",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "AssigneeId",
                table: "Subtasks");
        }
    }
}
