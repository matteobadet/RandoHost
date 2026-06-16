using MediaManager.Core.Entities;

namespace MediaManager.Core.Interfaces;

public interface IMediaRepository
{
    Task<Media?> GetByIdAsync(Guid id);
    Task<IEnumerable<Media>> GetAllAsync(int page, int pageSize);
    Task AddAsync(Media media);
    Task DeleteAsync(Guid id);
    Task SaveChangesAsync();
}
