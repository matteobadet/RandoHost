using Microsoft.EntityFrameworkCore;
using UserManager.Core.Entities;
using UserManager.Core.Interfaces;
using UserManager.Infrastructure.Data;

namespace UserManager.Infrastructure.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    private IQueryable<User> WithRole => db.Users.Include(u => u.Role);

    public Task<User?> GetByIdAsync(Guid id) =>
        WithRole.FirstOrDefaultAsync(u => u.Id == id);

    public Task<User?> GetByEmailAsync(string email) =>
        WithRole.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());

    public Task<User?> GetByPseudoAsync(string pseudo) =>
        WithRole.FirstOrDefaultAsync(u => u.Pseudo == pseudo);

    public async Task<IEnumerable<User>> GetAllAsync() =>
        await WithRole.OrderBy(u => u.Pseudo).ToListAsync();

    public async Task AddAsync(User user) => await db.Users.AddAsync(user);

    public Task UpdateAsync(User user)
    {
        db.Users.Update(user);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user != null) db.Users.Remove(user);
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();
}
