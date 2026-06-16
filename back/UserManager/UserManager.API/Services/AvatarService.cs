using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using UserManager.API.Options;
using UserManager.Core.Interfaces;

namespace UserManager.API.Services;

public class AvatarService(IAmazonS3 s3, IOptions<StorageOptions> opts) : IAvatarService
{
    private readonly string _bucket = opts.Value.AvatarBucket;
    private readonly string _internalHost = new Uri(opts.Value.Endpoint).Authority;
    private readonly string _publicEndpoint = opts.Value.PublicEndpoint ?? opts.Value.Endpoint;

    public async Task<string> UploadAvatarAsync(Stream stream, string contentType, Guid userId)
    {
        // Redimensionne à 256x256 et convertit en JPEG
        using var image = await Image.LoadAsync(stream);
        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(256, 256),
            Mode = ResizeMode.Crop
        }));

        using var output = new MemoryStream();
        await image.SaveAsJpegAsync(output);
        output.Position = 0;

        var key = $"avatars/{userId}.jpg";
        await s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = output,
            ContentType = "image/jpeg",
        });

        return key;
    }

    public string GetAvatarUrl(string key)
    {
        var url = s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Expires = DateTime.UtcNow.AddHours(1)
        });
        var uri = new Uri(url);
        return url.Replace($"{uri.Scheme}://{_internalHost}", _publicEndpoint.TrimEnd('/'));
    }

    public async Task DeleteAvatarAsync(string key) =>
        await s3.DeleteObjectAsync(_bucket, key);
}
