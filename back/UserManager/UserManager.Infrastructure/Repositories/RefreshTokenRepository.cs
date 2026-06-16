using Microsoft.EntityFrameworkCore;
using UserManager.Core.Entities;
using UserManager.Core.Interfaces;
using UserManager.Infrastructure.Data;

namespace UserManager.Infrastructure.Repositories;

public class RefreshTokenRepository(AppDbContext db) : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByTokenAsync(string token) =>
        db.RefreshTokens.Include(t => t.User).ThenInclude(u => u.Role)
            .FirstOrDefaultAsync(t => t.Token == token);

    public async Task AddAsync(RefreshToken token) => await db.RefreshTokens.AddAsync(token);

    public async Task RevokeAllForUserAsync(Guid userId)
    {
        var tokens = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();
        foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();
}
