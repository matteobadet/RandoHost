using MediaManager.API.Services;
using MediaManager.Core.Entities;
using MediaManager.Core.Interfaces;
using MediaManager.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediaManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaController(
    IMediaRepository mediaRepo,
    IStorageService storage,
    MediaProcessor processor,
    AppDbContext db) : ControllerBase
{
    // ── Helpers ─────────────────────────────────────────────────────────────

    private (Guid id, string name, string? avatar) GetCaller() =>
        (
            Request.Headers.TryGetValue("X-User-Id", out var id) && Guid.TryParse(id, out var guid) ? guid : Guid.Empty,
            Request.Headers.TryGetValue("X-User-Name", out var name) ? (string)name! : "Inconnu",
            Request.Headers.TryGetValue("X-User-Avatar", out var av) ? (string?)av : null
        );

    // ── Media CRUD ───────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var items = await mediaRepo.GetAllAsync(page, pageSize);
        return Ok(items.Select(m => new
        {
            m.Id, m.Filename, m.Type, m.MimeType, m.SizeBytes,
            m.Width, m.Height, m.TakenAt, m.CreatedAt,
            m.Description, m.Lieu,
            m.UploadedById, m.UploadedByName, m.UploadedByAvatar,
            Location = m.Location == null ? null : new { x = m.Location.X, y = m.Location.Y },
            Url = storage.GetPresignedUrl(m.StorageKey),
            ReactionCount = m.Reactions.GroupBy(r => r.Emoji)
                .Select(g => new { emoji = g.Key, count = g.Count() })
        }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var media = await mediaRepo.GetByIdAsync(id);
        if (media is null) return NotFound();
        return Ok(new
        {
            media.Id, media.Filename, media.Type, media.MimeType, media.SizeBytes,
            media.Width, media.Height, media.DurationSeconds, media.TakenAt, media.CreatedAt,
            media.Description, media.Lieu, media.Metadata,
            media.UploadedById, media.UploadedByName, media.UploadedByAvatar,
            Location = media.Location == null ? null : new { x = media.Location.X, y = media.Location.Y },
            Tags = media.MediaTags.Select(mt => mt.Tag.Name),
            Url = storage.GetPresignedUrl(media.StorageKey),
            ReactionCount = media.Reactions.GroupBy(r => r.Emoji)
                .Select(g => new { emoji = g.Key, count = g.Count() })
        });
    }

    [HttpPost("upload")]
    [RequestSizeLimit(500 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file.Length == 0) return BadRequest("Fichier vide.");

        var (userId, userName, userAvatar) = GetCaller();
        var media = await processor.ProcessAndStoreAsync(file);
        if (userId != Guid.Empty)
        {
            media.UploadedById = userId;
            media.UploadedByName = userName;
            media.UploadedByAvatar = userAvatar;
        }

        await mediaRepo.AddAsync(media);
        await mediaRepo.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = media.Id }, new { media.Id });
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMediaRequest req)
    {
        var media = await mediaRepo.GetByIdAsync(id);
        if (media is null) return NotFound();

        if (req.Description is not null) media.Description = req.Description;
        if (req.Lieu is not null) media.Lieu = req.Lieu;

        await mediaRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var media = await mediaRepo.GetByIdAsync(id);
        if (media is null) return NotFound();

        await storage.DeleteAsync(media.StorageKey);
        await mediaRepo.DeleteAsync(id);
        await mediaRepo.SaveChangesAsync();

        return NoContent();
    }

    // ── Commentaires ─────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/comments")]
    public async Task<IActionResult> GetComments(Guid id)
    {
        var comments = await db.Comments
            .Where(c => c.MediaId == id)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id, c.AuthorId, c.AuthorName, c.AuthorAvatar, c.Content, c.CreatedAt
            })
            .ToListAsync();
        return Ok(comments);
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] AddCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest("Contenu requis.");
        var (authorId, authorName, authorAvatar) = GetCaller();
        if (authorId == Guid.Empty) return BadRequest("X-User-Id requis.");

        var comment = new Comment
        {
            MediaId = id,
            AuthorId = authorId,
            AuthorName = authorName,
            AuthorAvatar = authorAvatar,
            Content = req.Content.Trim(),
        };
        db.Comments.Add(comment);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetComments), new { id },
            new { comment.Id, comment.AuthorId, comment.AuthorName, comment.AuthorAvatar, comment.Content, comment.CreatedAt });
    }

    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.MediaId == id);
        if (comment is null) return NotFound();
        db.Comments.Remove(comment);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Réactions ────────────────────────────────────────────────────────────

    [HttpGet("{id:guid}/reactions")]
    public async Task<IActionResult> GetReactions(Guid id, [FromQuery] Guid? userId)
    {
        var reactions = await db.Reactions.Where(r => r.MediaId == id).ToListAsync();
        var grouped = reactions.GroupBy(r => r.Emoji).Select(g => new
        {
            emoji = g.Key,
            count = g.Count(),
            users = g.Select(r => new { r.AuthorId, r.AuthorName }).ToList(),
            mine = userId.HasValue && g.Any(r => r.AuthorId == userId)
        });
        return Ok(grouped);
    }

    [HttpPost("{id:guid}/reactions")]
    public async Task<IActionResult> AddReaction(Guid id, [FromBody] AddReactionRequest req)
    {
        var (authorId, authorName, _) = GetCaller();
        if (authorId == Guid.Empty) return BadRequest("X-User-Id requis.");

        var existing = await db.Reactions
            .FirstOrDefaultAsync(r => r.MediaId == id && r.AuthorId == authorId && r.Emoji == req.Emoji);

        if (existing is not null)
        {
            // Toggle: remove if already reacted
            db.Reactions.Remove(existing);
        }
        else
        {
            db.Reactions.Add(new Reaction
            {
                MediaId = id,
                AuthorId = authorId,
                AuthorName = authorName,
                Emoji = req.Emoji,
            });
        }

        await db.SaveChangesAsync();
        return await GetReactions(id, authorId);
    }
}

public record UpdateMediaRequest(string? Description, string? Lieu);
public record AddCommentRequest(string Content);
public record AddReactionRequest(string Emoji);
