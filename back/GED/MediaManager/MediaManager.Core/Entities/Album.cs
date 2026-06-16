namespace MediaManager.Core.Entities;

public class Album
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public string? Lieu { get; set; }
    public DateTime? Date { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<AlbumMedia> AlbumMedia { get; set; } = [];
}

public class AlbumMedia
{
    public Guid AlbumId { get; set; }
    public Album Album { get; set; } = default!;
    public Guid MediaId { get; set; }
    public Media Media { get; set; } = default!;
    public int Order { get; set; }
}
