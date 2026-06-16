using MediaManager.Core.Entities;
using MediaManager.Core.Interfaces;
using MediaManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MediaManager.Infrastructure.Repositories;

public class AlbumRepository(AppDbContext db) : IAlbumRepository
{
    public Task<Album?> GetByIdAsync(Guid id) =>
        db.Albums.Include(a => a.AlbumMedia).ThenInclude(am => am.Media).FirstOrDefaultAsync(a => a.Id == id);

    public async Task<IEnumerable<Album>> GetAllAsync() =>
        await db.Albums.OrderBy(a => a.Name).ToListAsync();

    public async Task AddAsync(Album album) => await db.Albums.AddAsync(album);

    public async Task AddMediaAsync(Guid albumId, Guid mediaId, int order = 0)
    {
        var entry = new AlbumMedia { AlbumId = albumId, MediaId = mediaId, Order = order };
        await db.AlbumMedia.AddAsync(entry);
    }

    public async Task RemoveMediaAsync(Guid albumId, Guid mediaId)
    {
        var entry = await db.AlbumMedia.FindAsync(albumId, mediaId);
        if (entry != null) db.AlbumMedia.Remove(entry);
    }

    public Task UpdateAsync(Album album)
    {
        db.Albums.Update(album);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var album = await db.Albums.FindAsync(id);
        if (album != null) db.Albums.Remove(album);
    }

    public Task SaveChangesAsync() => db.SaveChangesAsync();
}
