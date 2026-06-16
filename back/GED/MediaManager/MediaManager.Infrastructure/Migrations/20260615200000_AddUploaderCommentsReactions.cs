using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediaManager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUploaderCommentsReactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add uploader columns to Media
            migrationBuilder.AddColumn<Guid>(
                name: "UploadedById",
                table: "Media",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UploadedByName",
                table: "Media",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UploadedByAvatar",
                table: "Media",
                type: "text",
                nullable: true);

            // Create Comments table
            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MediaId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorName = table.Column<string>(type: "text", nullable: false),
                    AuthorAvatar = table.Column<string>(type: "text", nullable: true),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_Media_MediaId",
                        column: x => x.MediaId,
                        principalTable: "Media",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Comments_MediaId",
                table: "Comments",
                column: "MediaId");

            // Create Reactions table
            migrationBuilder.CreateTable(
                name: "Reactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MediaId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorName = table.Column<string>(type: "text", nullable: false),
                    Emoji = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reactions_Media_MediaId",
                        column: x => x.MediaId,
                        principalTable: "Media",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reactions_MediaId_AuthorId_Emoji",
                table: "Reactions",
                columns: new[] { "MediaId", "AuthorId", "Emoji" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Comments");
            migrationBuilder.DropTable(name: "Reactions");
            migrationBuilder.DropColumn(name: "UploadedById", table: "Media");
            migrationBuilder.DropColumn(name: "UploadedByName", table: "Media");
            migrationBuilder.DropColumn(name: "UploadedByAvatar", table: "Media");
        }
    }
}
