using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManager.API.Services;

namespace UserManager.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, UserService userService, IWebHostEnvironment env) : ControllerBase
{
    // En prod HTTPS : Secure=true, SameSite=None (cross-origin)
    // En dev HTTP   : Secure=false, SameSite=Lax (cross-port autorisé)
    private CookieOptions RefreshCookieOptions => new()
    {
        HttpOnly = true,
        Secure = !env.IsDevelopment(),
        SameSite = env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    };

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var user = await userService.RegisterAsync(req.Pseudo, req.Email, req.Password);
        if (user is null) return Conflict(new { error = "Pseudo ou email déjà utilisé." });
        return CreatedAtRoute(null, new { user.Id, user.Pseudo, user.Email });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await authService.LoginAsync(req.Email, req.Password);
        if (result is null) return Unauthorized(new { error = "Identifiants invalides." });

        var (user, accessToken, refreshToken) = result.Value;

        Response.Cookies.Append("refresh_token", refreshToken, RefreshCookieOptions);

        return Ok(new
        {
            accessToken,
            user = new { user.Id, user.Pseudo, user.Email, Role = user.Role.Name.ToString(),
                         Permissions = user.GetEffectivePermissions(), user.AvatarKey }
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(refreshToken)) return Unauthorized();

        var result = await authService.RefreshAsync(refreshToken);
        if (result is null) return Unauthorized(new { error = "Token expiré ou révoqué." });

        var (newAccess, newRefresh) = result.Value;

        Response.Cookies.Append("refresh_token", newRefresh, RefreshCookieOptions);

        return Ok(new { accessToken = newAccess });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = Guid.Parse(User.FindFirst("sub")!.Value);
        await authService.LogoutAsync(userId);
        Response.Cookies.Delete("refresh_token");
        return NoContent();
    }
}

public record RegisterRequest(string Pseudo, string Email, string Password);
public record LoginRequest(string Email, string Password);
