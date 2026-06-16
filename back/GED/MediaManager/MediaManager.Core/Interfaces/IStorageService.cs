namespace MediaManager.Core.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(Stream stream, string key, string contentType);
    Task DownloadToFileAsync(string key, string filePath);
    string GetPresignedUrl(string key, int expiryMinutes = 60);
    Task DeleteAsync(string key);
}
