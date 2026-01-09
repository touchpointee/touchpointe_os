using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDealContacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deals_Contacts_ContactId",
                table: "Deals");

            migrationBuilder.DropIndex(
                name: "IX_Deals_ContactId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "ContactId",
                table: "Deals");

            migrationBuilder.CreateTable(
                name: "DealContacts",
                columns: table => new
                {
                    DealId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DealContacts", x => new { x.DealId, x.ContactId });
                    table.ForeignKey(
                        name: "FK_DealContacts_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DealContacts_Deals_DealId",
                        column: x => x.DealId,
                        principalTable: "Deals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DealContacts_ContactId",
                table: "DealContacts",
                column: "ContactId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DealContacts");

            migrationBuilder.AddColumn<Guid>(
                name: "ContactId",
                table: "Deals",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Deals_ContactId",
                table: "Deals",
                column: "ContactId");

            migrationBuilder.AddForeignKey(
                name: "FK_Deals_Contacts_ContactId",
                table: "Deals",
                column: "ContactId",
                principalTable: "Contacts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
