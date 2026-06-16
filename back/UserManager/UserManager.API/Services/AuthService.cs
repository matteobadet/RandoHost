using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using UserManager.API.Options;
using UserManager.Core.Entities;
using UserManager.Core.Interfaces;

namespace UserManager.API.Services;

public class AuthService(
    IUserRepository userRepo,
    IRefreshTokenRepository tokenRepo,
    IOptions<JwtOptions> jwtOpts)
{
    private readonly JwtOptions _jwt = jwtOpts.Value;

    public async Task<(User user, string accessToken, string refreshToken)?> LoginAsync(string email, string password)
    {
        var user = await userRepo.GetByEmailAsync(email);
        if (user is null || !user.IsActive || !HashService.Verify(password, user.PasswordHash))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await userRepo.UpdateAsync(user);

        var access = GenerateAccessToken(user);
        var refresh = await IssueRefreshTokenAsync(user.Id);

        await userRepo.SaveChangesAsync();
        return (user, access, refresh);
    }

    public async Task<(string accessToken, string refreshToken)?> RefreshAsync(string refreshToken)
    {
        var stored = await tokenRepo.GetByTokenAsync(refreshToken);
        if (stored is null || !stored.IsActive) return null;

        stored.RevokedAt = DateTime.UtcNow;

        var user = stored.User;
        var newAccess = GenerateAccessToken(user);
        var newRefresh = await IssueRefreshTokenAsync(user.Id);

        await tokenRepo.SaveChangesAsync();
        return (newAccess, newRefresh);
    }

    public async Task LogoutAsync(Guid userId)
    {
        await tokenRepo.RevokeAllForUserAsync(userId);
        await tokenRepo.SaveChangesAsync();
    }

    private string GenerateAccessToken(User user)
    {
        var permissions = user.GetEffectivePermissions();
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("pseudo", user.Pseudo),
            new("role", user.Role.Name.ToString()),
        };
        claims.AddRange(permissions.Select(p => new Claim("permission", p)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> IssueRefreshTokenAsync(Guid userId)
    {
        var raw = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(raw);

        await tokenRepo.AddAsync(new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays)
        });

        return token;
    }
}
