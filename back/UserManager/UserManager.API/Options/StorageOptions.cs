namespace UserManager.API.Options;

public class StorageOptions
{
    public string Endpoint { get; set; } = default!;
    public string? PublicEndpoint { get; set; }
    public string AccessKey { get; set; } = default!;
    public string SecretKey { get; set; } = default!;
    public string AvatarBucket { get; set; } = "avatars";
}
