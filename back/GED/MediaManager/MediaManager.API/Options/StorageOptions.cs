namespace MediaManager.API.Options;

public class StorageOptions
{
    public string Endpoint { get; set; } = default!;
    // Browser-accessible URL for presigned links (defaults to Endpoint if unset)
    public string? PublicEndpoint { get; set; }
    public string AccessKey { get; set; } = default!;
    public string SecretKey { get; set; } = default!;
    public string BucketName { get; set; } = "media";
}
