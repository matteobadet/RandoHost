using MediaManager.Core.Entities;
using MediaManager.Core.Interfaces;
using MediaManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaManager.Infrastructure.Repositories;

public class MediaRepository(AppDbContext db) : IMediaRepository
{
    public Task<Media?> GetByIdAsync(Guid id) =>
        db.Media
            .Include(m => m.MediaTags).ThenInclude(mt => mt.Tag)
            .Include(m => m.Reactions)
            .FirstOrDefaultAsync(m => m.Id == id);

    public async Task<IEnumerable<Media>> GetAllAsync(int page, int pageSize) =>
        await db.Media
            .Include(m => m.Reactions)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

    public async Task AddAsync(Media media) => await db.Media.AddAsync(media);

    public async Task DeleteAsync(Guid id)
    {
        var media = await db.Media.FindAsync(id);
        if (media != null) db.Media.Remove(media);
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();
}
