using MediaManager.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace MediaManager.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Media> Media => Set<Media>();
    public DbSet<Album> Albums => Set<Album>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<MediaTag> MediaTags => Set<MediaTag>();
    public DbSet<AlbumMedia> AlbumMedia => Set<AlbumMedia>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Reaction> Reactions => Set<Reaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");

        modelBuilder.Entity<MediaTag>()
            .HasKey(mt => new { mt.MediaId, mt.TagId });

        modelBuilder.Entity<AlbumMedia>()
            .HasKey(am => new { am.AlbumId, am.MediaId });

        modelBuilder.Entity<Media>()
            .Property(m => m.Metadata)
            .HasColumnType("jsonb");

        modelBuilder.Entity<Media>()
            .Property(m => m.Location)
            .HasColumnType("geometry(Point, 4326)");

        // One emoji per user per media
        modelBuilder.Entity<Reaction>()
            .HasIndex(r => new { r.MediaId, r.AuthorId, r.Emoji })
            .IsUnique();
    }
}
