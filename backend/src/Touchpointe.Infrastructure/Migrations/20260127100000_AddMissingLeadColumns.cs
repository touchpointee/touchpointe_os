using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    public partial class AddMissingLeadColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add missing columns to Leads table
            migrationBuilder.AddColumn<string>(
                name: "FacebookLeadId",
                table: "Leads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleLeadId",
                table: "Leads",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FacebookLeadId", table: "Leads");
            migrationBuilder.DropColumn(name: "GoogleLeadId", table: "Leads");
        }
    }
}
