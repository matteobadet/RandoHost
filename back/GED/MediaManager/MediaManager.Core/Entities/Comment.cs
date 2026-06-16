namespace MediaManager.Core.Entities;

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MediaId { get; set; }
    public Media Media { get; set; } = default!;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = default!;
    public string? AuthorAvatar { get; set; }
    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
