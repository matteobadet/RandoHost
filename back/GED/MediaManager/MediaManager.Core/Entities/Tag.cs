namespace MediaManager.Core.Entities;

public class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = default!;
    public ICollection<MediaTag> MediaTags { get; set; } = [];
}

public class MediaTag
{
    public Guid MediaId { get; set; }
    public Media Media { get; set; } = default!;
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = default!;
}
