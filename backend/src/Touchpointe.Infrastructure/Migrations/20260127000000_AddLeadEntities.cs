using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Touchpointe.Infrastructure.Migrations
{
    public partial class AddLeadEntities : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Lead Forms Table
            migrationBuilder.CreateTable(
                name: "LeadForms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    FieldsConfig = table.Column<string>(type: "text", nullable: false),
                    SuccessRedirectUrl = table.Column<string>(type: "text", nullable: true),
                    SuccessMessage = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SubmissionCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadForms_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadForms_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(name: "IX_LeadForms_WorkspaceId", table: "LeadForms", column: "WorkspaceId");
            migrationBuilder.CreateIndex(name: "IX_LeadForms_Token", table: "LeadForms", column: "Token", unique: true);
            migrationBuilder.CreateIndex(name: "IX_LeadForms_CreatedByUserId", table: "LeadForms", column: "CreatedByUserId");

            // Leads Table
            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    FormId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedToUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConvertedToContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    CompanyName = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    UtmSource = table.Column<string>(type: "text", nullable: true),
                    UtmMedium = table.Column<string>(type: "text", nullable: true),
                    UtmCampaign = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastActivityAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leads_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Leads_LeadForms_FormId",
                        column: x => x.FormId,
                        principalTable: "LeadForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Leads_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Leads_Contacts_ConvertedToContactId",
                        column: x => x.ConvertedToContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(name: "IX_Leads_WorkspaceId", table: "Leads", column: "WorkspaceId");
            migrationBuilder.CreateIndex(name: "IX_Leads_Email", table: "Leads", column: "Email");
            migrationBuilder.CreateIndex(name: "IX_Leads_FormId", table: "Leads", column: "FormId");
            migrationBuilder.CreateIndex(name: "IX_Leads_AssignedToUserId", table: "Leads", column: "AssignedToUserId");
            migrationBuilder.CreateIndex(name: "IX_Leads_ConvertedToContactId", table: "Leads", column: "ConvertedToContactId");

            // LeadActivities Table
            migrationBuilder.CreateTable(
                name: "LeadActivities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    OldValue = table.Column<string>(type: "text", nullable: true),
                    NewValue = table.Column<string>(type: "text", nullable: true),
                    ScoreChange = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadActivities_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadActivities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(name: "IX_LeadActivities_LeadId", table: "LeadActivities", column: "LeadId");
            migrationBuilder.CreateIndex(name: "IX_LeadActivities_UserId", table: "LeadActivities", column: "UserId");

            // FacebookIntegrations Table
            migrationBuilder.CreateTable(
                name: "FacebookIntegrations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PageId = table.Column<string>(type: "text", nullable: false),
                    PageName = table.Column<string>(type: "text", nullable: false),
                    PageAccessToken = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSyncAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacebookIntegrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FacebookIntegrations_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FacebookIntegrations_Users_ConnectedByUserId",
                        column: x => x.ConnectedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(name: "IX_FacebookIntegrations_WorkspaceId", table: "FacebookIntegrations", column: "WorkspaceId", unique: true);
            migrationBuilder.CreateIndex(name: "IX_FacebookIntegrations_ConnectedByUserId", table: "FacebookIntegrations", column: "ConnectedByUserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "FacebookIntegrations");
            migrationBuilder.DropTable(name: "LeadActivities");
            migrationBuilder.DropTable(name: "Leads");
            migrationBuilder.DropTable(name: "LeadForms");
        }
    }
}
