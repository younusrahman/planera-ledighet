using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planera_ledighet.api.Migrations
{
    /// <inheritdoc />
    public partial class absenceStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Absences",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Absences",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Absences");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Absences");
        }
    }
}
