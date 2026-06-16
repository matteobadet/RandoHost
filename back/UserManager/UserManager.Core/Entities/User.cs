namespace UserManager.Core.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Pseudo { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string? AvatarKey { get; set; }
    public int RoleId { get; set; }
    public Role Role { get; set; } = default!;

    // Permissions supplémentaires ou retirées par rapport au rôle
    public string[] ExtraPermissions { get; set; } = [];
    public string[] RevokedPermissions { get; set; } = [];

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];

    // Résout les permissions effectives : rôle + extra - révoquées
    public string[] GetEffectivePermissions()
    {
        var effective = Role.DefaultPermissions
            .Union(ExtraPermissions)
            .Except(RevokedPermissions)
            .Distinct()
            .ToArray();
        return effective;
    }

    public bool HasPermission(string permission) =>
        GetEffectivePermissions().Contains(permission);
}
