using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    public partial class AddMissingFacebookFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdAccountId",
                table: "FacebookIntegrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LeadFormId",
                table: "FacebookIntegrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAccessToken",
                table: "FacebookIntegrations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenExpiresAt",
                table: "FacebookIntegrations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalLeadsSynced",
                table: "FacebookIntegrations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "FacebookIntegrations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdAccountId",
                table: "FacebookIntegrations");

            migrationBuilder.DropColumn(
                name: "LeadFormId",
                table: "FacebookIntegrations");

            migrationBuilder.DropColumn(
                name: "UserAccessToken",
                table: "FacebookIntegrations");

            migrationBuilder.DropColumn(
                name: "TokenExpiresAt",
                table: "FacebookIntegrations");

            migrationBuilder.DropColumn(
                name: "TotalLeadsSynced",
                table: "FacebookIntegrations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "FacebookIntegrations");
        }
    }
}
