using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planera_ledighet.api.Migrations
{
    /// <inheritdoc />
    public partial class AddUiConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UiConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BlockPastDays = table.Column<bool>(type: "INTEGER", nullable: false),
                    DisableDeletion = table.Column<bool>(type: "INTEGER", nullable: false),
                    CellWidth = table.Column<int>(type: "INTEGER", nullable: false),
                    RowHeight = table.Column<int>(type: "INTEGER", nullable: false),
                    SidebarWidthFull = table.Column<int>(type: "INTEGER", nullable: false),
                    SidebarWidthCompact = table.Column<int>(type: "INTEGER", nullable: false),
                    SidebarWidthHidden = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UiConfigs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UiConfigs");
        }
    }
}
