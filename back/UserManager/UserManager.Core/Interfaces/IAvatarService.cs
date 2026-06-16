namespace UserManager.Core.Interfaces;

public interface IAvatarService
{
    Task<string> UploadAvatarAsync(Stream stream, string contentType, Guid userId);
    string GetAvatarUrl(string key);
    Task DeleteAvatarAsync(string key);
}
