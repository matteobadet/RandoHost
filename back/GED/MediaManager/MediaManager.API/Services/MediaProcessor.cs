using MediaManager.Core.Entities;
using MediaManager.Core.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Xabe.FFmpeg;

namespace MediaManager.API.Services;

public class MediaProcessor(IStorageService storage, ExifService exifService)
{
    public async Task<Media> ProcessAndStoreAsync(IFormFile file)
    {
        var id = Guid.NewGuid();
        var isVideo = file.ContentType.StartsWith("video/");
        var ext = Path.GetExtension(file.FileName);

        // Read entire file into bytes so each operation gets a fresh, seekable stream.
        // AWS SDK disposes InputStream after PutObjectAsync, so sharing one MemoryStream fails.
        using var tmp = new MemoryStream();
        await file.CopyToAsync(tmp);
        var bytes = tmp.ToArray();

        var originalKey = $"{(isVideo ? "videos" : "photos")}/original/{id}{ext}";
        await storage.UploadAsync(new MemoryStream(bytes), originalKey, file.ContentType);

        var exif = exifService.Extract(new MemoryStream(bytes));

        string thumbKey;
        int width = 0, height = 0;

        if (!isVideo)
        {
            using var image = await Image.LoadAsync(new MemoryStream(bytes));
            width = image.Width;
            height = image.Height;
            image.Mutate(x => x.Resize(400, 0));
            using var thumbStream = new MemoryStream();
            await image.SaveAsJpegAsync(thumbStream);
            thumbStream.Position = 0;
            thumbKey = $"photos/thumb/{id}.jpg";
            await storage.UploadAsync(thumbStream, thumbKey, "image/jpeg");
        }
        else
        {
            thumbKey = await GenerateVideoThumbnailAsync(id, originalKey);
        }

        return new Media
        {
            Id = id,
            StorageKey = originalKey,
            Type = isVideo ? MediaType.Video : MediaType.Photo,
            Filename = file.FileName,
            MimeType = file.ContentType,
            SizeBytes = file.Length,
            Width = width > 0 ? width : null,
            Height = height > 0 ? height : null,
            TakenAt = exif.TakenAt,
            Location = exif.GpsPoint,
            Metadata = exif.Raw,
        };
    }

    private async Task<string> GenerateVideoThumbnailAsync(Guid id, string originalKey)
    {
        var tempInput = Path.GetTempFileName() + ".mp4";
        var tempOutput = Path.GetTempFileName() + ".jpg";
        try
        {
            await storage.DownloadToFileAsync(originalKey, tempInput);

            var conversion = await FFmpeg.Conversions.New()
                .AddParameter($"-i \"{tempInput}\" -ss 00:00:01 -vframes 1 \"{tempOutput}\"")
                .Start();

            var thumbKey = $"videos/thumb/{id}.jpg";
            await using var thumbStream = File.OpenRead(tempOutput);
            await storage.UploadAsync(thumbStream, thumbKey, "image/jpeg");
            return thumbKey;
        }
        finally
        {
            if (File.Exists(tempInput)) File.Delete(tempInput);
            if (File.Exists(tempOutput)) File.Delete(tempOutput);
        }
    }
}
