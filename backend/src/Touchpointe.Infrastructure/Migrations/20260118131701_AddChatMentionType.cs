using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChatMentionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Info",
                table: "ChatMentions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SourceUserId",
                table: "ChatMentions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "ChatMentions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMentions_SourceUserId",
                table: "ChatMentions",
                column: "SourceUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMentions_Users_SourceUserId",
                table: "ChatMentions",
                column: "SourceUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMentions_Users_SourceUserId",
                table: "ChatMentions");

            migrationBuilder.DropIndex(
                name: "IX_ChatMentions_SourceUserId",
                table: "ChatMentions");

            migrationBuilder.DropColumn(
                name: "Info",
                table: "ChatMentions");

            migrationBuilder.DropColumn(
                name: "SourceUserId",
                table: "ChatMentions");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "ChatMentions");
        }
    }
}
