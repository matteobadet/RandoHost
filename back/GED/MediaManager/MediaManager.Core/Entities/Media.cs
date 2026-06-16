using System.Text.Json;
using NetTopologySuite.Geometries;

namespace MediaManager.Core.Entities;

public enum MediaType { Photo, Video }

public class Media
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public MediaType Type { get; set; }
    public string Filename { get; set; } = default!;
    public string StorageKey { get; set; } = default!;
    public string? MimeType { get; set; }
    public long SizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public float? DurationSeconds { get; set; }
    public DateTime? TakenAt { get; set; }
    public Point? Location { get; set; }
    public JsonDocument? Metadata { get; set; }
    public string? Description { get; set; }
    public string? Lieu { get; set; }
    public Guid? UploadedById { get; set; }
    public string? UploadedByName { get; set; }
    public string? UploadedByAvatar { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<MediaTag> MediaTags { get; set; } = [];
    public ICollection<AlbumMedia> AlbumMedia { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<Reaction> Reactions { get; set; } = [];
}
