using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    public partial class FixMissingCreatedByIdColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add missing CreatedById columns to Lists, Folders, Spaces
            migrationBuilder.Sql(@"
DO $$
BEGIN
    -- Add CreatedById to Lists if missing
    BEGIN
        ALTER TABLE ""Lists"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Add CreatedById to Folders if missing
    BEGIN
        ALTER TABLE ""Folders"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Add CreatedById to Spaces if missing
    BEGIN
        ALTER TABLE ""Spaces"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Optional: Drop columns if rolling back
            migrationBuilder.DropColumn(name: "CreatedById", table: "Lists");
            migrationBuilder.DropColumn(name: "CreatedById", table: "Folders");
            migrationBuilder.DropColumn(name: "CreatedById", table: "Spaces");
        }
    }
}
