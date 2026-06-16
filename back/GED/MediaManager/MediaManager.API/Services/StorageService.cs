using Amazon.S3;
using Amazon.S3.Model;
using MediaManager.API.Options;
using MediaManager.Core.Interfaces;
using Microsoft.Extensions.Options;

namespace MediaManager.API.Services;

public class StorageService(IAmazonS3 s3, IOptions<StorageOptions> opts) : IStorageService
{
    private readonly string _bucket = opts.Value.BucketName;
    // Extract just the host:port for matching (ignore http/https scheme differences)
    private readonly string _internalHost = new Uri(opts.Value.Endpoint).Authority;
    private readonly string _publicEndpoint = opts.Value.PublicEndpoint ?? opts.Value.Endpoint;

    public async Task<string> UploadAsync(Stream stream, string key, string contentType)
    {
        await s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
        });
        return key;
    }

    public async Task DownloadToFileAsync(string key, string filePath)
    {
        var response = await s3.GetObjectAsync(_bucket, key);
        await using var fs = File.Create(filePath);
        await response.ResponseStream.CopyToAsync(fs);
    }

    public string GetPresignedUrl(string key, int expiryMinutes = 60)
    {
        var url = s3.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes)
        });
        // Replace internal Docker host with public-facing endpoint for browser access
        var uri = new Uri(url);
        var publicUri = new Uri(_publicEndpoint);
        return url.Replace($"{uri.Scheme}://{_internalHost}", _publicEndpoint.TrimEnd('/'));
    }

    public async Task DeleteAsync(string key) =>
        await s3.DeleteObjectAsync(_bucket, key);
}
