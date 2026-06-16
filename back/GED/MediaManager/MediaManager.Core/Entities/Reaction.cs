namespace MediaManager.Core.Entities;

public class Reaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MediaId { get; set; }
    public Media Media { get; set; } = default!;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = default!;
    public string Emoji { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
