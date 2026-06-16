namespace UserManager.API.Options;

public class JwtOptions
{
    public string Secret { get; set; } = default!;
    public string Issuer { get; set; } = "UserManager";
    public string Audience { get; set; } = "RandoHostApps";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
