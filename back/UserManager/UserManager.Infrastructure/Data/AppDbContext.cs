using Microsoft.EntityFrameworkCore;
using UserManager.Core.Entities;

namespace UserManager.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Pseudo).IsUnique();

        modelBuilder.Entity<User>()
            .Property(u => u.ExtraPermissions)
            .HasColumnType("text[]");

        modelBuilder.Entity<User>()
            .Property(u => u.RevokedPermissions)
            .HasColumnType("text[]");

        modelBuilder.Entity<Role>()
            .Property(r => r.DefaultPermissions)
            .HasColumnType("text[]");

        modelBuilder.Entity<Role>()
            .Property(r => r.Name)
            .HasConversion<string>();

        // Seed des rôles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = RoleName.Admin,       DefaultPermissions = Permissions.AdminDefaults },
            new Role { Id = 2, Name = RoleName.Contributor, DefaultPermissions = Permissions.ContributorDefaults },
            new Role { Id = 3, Name = RoleName.ReadOnly,    DefaultPermissions = Permissions.ReadOnlyDefaults }
        );
    }
}
