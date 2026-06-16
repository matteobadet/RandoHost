using UserManager.Core.Entities;

namespace UserManager.Core.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token);
    Task AddAsync(RefreshToken token);
    Task RevokeAllForUserAsync(Guid userId);
    Task SaveChangesAsync();
}
