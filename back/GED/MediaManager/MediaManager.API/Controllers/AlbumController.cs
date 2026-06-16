using MediaManager.Core.Entities;
using MediaManager.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MediaManager.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlbumController(IAlbumRepository albumRepo, IStorageService storage) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var albums = await albumRepo.GetAllAsync();
        return Ok(albums.Select(a => new
        {
            a.Id, a.Name, a.Description, a.Lieu, a.Date, a.CreatedAt,
            MediaCount = a.AlbumMedia.Count
        }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var album = await albumRepo.GetByIdAsync(id);
        if (album is null) return NotFound();

        return Ok(new
        {
            album.Id, album.Name, album.Description, album.Lieu, album.Date, album.CreatedAt,
            AlbumMedia = album.AlbumMedia.OrderBy(am => am.Order).Select(am => new
            {
                am.Order,
                Media = new
                {
                    am.Media.Id, am.Media.Filename, am.Media.Type, am.Media.MimeType,
                    am.Media.Width, am.Media.Height, am.Media.DurationSeconds,
                    am.Media.TakenAt, am.Media.CreatedAt, am.Media.Description, am.Media.Lieu,
                    Location = am.Media.Location == null ? null : new { x = am.Media.Location.X, y = am.Media.Location.Y },
                    Url = storage.GetPresignedUrl(am.Media.StorageKey)
                }
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAlbumRequest req)
    {
        var album = new Album
        {
            Name = req.Name,
            Description = req.Description,
            Lieu = req.Lieu,
            Date = req.Date.HasValue ? DateTime.SpecifyKind(req.Date.Value, DateTimeKind.Utc) : null,
        };
        await albumRepo.AddAsync(album);
        await albumRepo.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = album.Id }, new { album.Id });
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAlbumRequest req)
    {
        var album = await albumRepo.GetByIdAsync(id);
        if (album is null) return NotFound();

        if (req.Name is not null) album.Name = req.Name;
        if (req.Description is not null) album.Description = req.Description;
        if (req.Lieu is not null) album.Lieu = req.Lieu;
        if (req.Date.HasValue) album.Date = DateTime.SpecifyKind(req.Date.Value, DateTimeKind.Utc);

        await albumRepo.UpdateAsync(album);
        await albumRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{albumId:guid}/media/{mediaId:guid}")]
    public async Task<IActionResult> AddMedia(Guid albumId, Guid mediaId, [FromQuery] int order = 0)
    {
        await albumRepo.AddMediaAsync(albumId, mediaId, order);
        await albumRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{albumId:guid}/media/{mediaId:guid}")]
    public async Task<IActionResult> RemoveMedia(Guid albumId, Guid mediaId)
    {
        await albumRepo.RemoveMediaAsync(albumId, mediaId);
        await albumRepo.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await albumRepo.DeleteAsync(id);
        await albumRepo.SaveChangesAsync();
        return NoContent();
    }
}

public record CreateAlbumRequest(string Name, string? Description, string? Lieu, DateTime? Date);
public record UpdateAlbumRequest(string? Name, string? Description, string? Lieu, DateTime? Date);
