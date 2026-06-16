using MediaManager.Core.Entities;

namespace MediaManager.Core.Interfaces;

public interface IAlbumRepository
{
    Task<Album?> GetByIdAsync(Guid id);
    Task<IEnumerable<Album>> GetAllAsync();
    Task AddAsync(Album album);
    Task AddMediaAsync(Guid albumId, Guid mediaId, int order = 0);
    Task RemoveMediaAsync(Guid albumId, Guid mediaId);
    Task UpdateAsync(Album album);
    Task DeleteAsync(Guid id);
    Task SaveChangesAsync();
}
