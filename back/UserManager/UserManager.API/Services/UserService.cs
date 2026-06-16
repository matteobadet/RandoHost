using UserManager.Core.Entities;
using UserManager.Core.Interfaces;

namespace UserManager.API.Services;

public class UserService(IUserRepository userRepo)
{
    public Task<IEnumerable<User>> GetAllAsync() => userRepo.GetAllAsync();

    public Task<User?> GetByIdAsync(Guid id) => userRepo.GetByIdAsync(id);

    public async Task<User?> RegisterAsync(string pseudo, string email, string password, int roleId = 2)
    {
        if (await userRepo.GetByEmailAsync(email) is not null) return null;
        if (await userRepo.GetByPseudoAsync(pseudo) is not null) return null;

        var user = new User
        {
            Pseudo = pseudo,
            Email = email.ToLowerInvariant(),
            PasswordHash = HashService.Sha256(password),
            RoleId = roleId,
        };

        await userRepo.AddAsync(user);
        await userRepo.SaveChangesAsync();
        return user;
    }

    public async Task<bool> UpdateProfileAsync(Guid id, string? pseudo, string? email, string? password, string? avatarKey)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user is null) return false;

        if (pseudo is not null) user.Pseudo = pseudo;
        if (email is not null) user.Email = email.ToLowerInvariant();
        if (password is not null) user.PasswordHash = HashService.Sha256(password);
        if (avatarKey is not null) user.AvatarKey = avatarKey;

        await userRepo.UpdateAsync(user);
        await userRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetRoleAsync(Guid id, int roleId)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user is null) return false;
        user.RoleId = roleId;
        await userRepo.UpdateAsync(user);
        await userRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetPermissionsAsync(Guid id, string[]? extra, string[]? revoked)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user is null) return false;
        if (extra is not null) user.ExtraPermissions = extra;
        if (revoked is not null) user.RevokedPermissions = revoked;
        await userRepo.UpdateAsync(user);
        await userRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetActiveAsync(Guid id, bool isActive)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user is null) return false;
        user.IsActive = isActive;
        await userRepo.UpdateAsync(user);
        await userRepo.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user is null) return false;
        await userRepo.DeleteAsync(id);
        await userRepo.SaveChangesAsync();
        return true;
    }
}
