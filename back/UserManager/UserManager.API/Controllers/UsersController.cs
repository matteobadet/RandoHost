using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserManager.API.Middleware;
using UserManager.API.Services;
using UserManager.Core.Entities;
using UserManager.Core.Interfaces;

namespace UserManager.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(UserService userService, IAvatarService avatarService) : ControllerBase
{
    // --- Profil personnel ---

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var id = Guid.Parse(User.FindFirst("sub")!.Value);
        var user = await userService.GetByIdAsync(id);
        if (user is null) return NotFound();
        return Ok(MapUser(user, avatarService));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req)
    {
        var id = Guid.Parse(User.FindFirst("sub")!.Value);
        var ok = await userService.UpdateProfileAsync(id, req.Pseudo, req.Email, req.Password, null);
        return ok ? NoContent() : NotFound();
    }

    [HttpPut("me/avatar")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file.Length == 0) return BadRequest("Fichier vide.");
        var id = Guid.Parse(User.FindFirst("sub")!.Value);

        using var stream = file.OpenReadStream();
        var key = await avatarService.UploadAvatarAsync(stream, file.ContentType, id);
        await userService.UpdateProfileAsync(id, null, null, null, key);

        return Ok(new { avatarUrl = avatarService.GetAvatarUrl(key) });
    }

    // --- Admin : gestion des utilisateurs ---

    [HttpGet]
    [RequirePermission(Permissions.UserManage)]
    public async Task<IActionResult> GetAll()
    {
        var users = await userService.GetAllAsync();
        return Ok(users.Select(u => MapUser(u, avatarService)));
    }

    [HttpGet("{id:guid}")]
    [RequirePermission(Permissions.UserManage)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await userService.GetByIdAsync(id);
        if (user is null) return NotFound();
        return Ok(MapUser(user, avatarService));
    }

    [HttpPatch("{id:guid}/role")]
    [RequirePermission(Permissions.UserManage)]
    public async Task<IActionResult> SetRole(Guid id, [FromBody] SetRoleRequest req)
    {
        var ok = await userService.SetRoleAsync(id, req.RoleId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPatch("{id:guid}/permissions")]
    [RequirePermission(Permissions.UserManage)]
    public async Task<IActionResult> SetPermissions(Guid id, [FromBody] SetPermissionsRequest req)
    {
        var ok = await userService.SetPermissionsAsync(id, req.ExtraPermissions, req.RevokedPermissions);
        return ok ? NoContent() : NotFound();
    }

    [HttpPatch("{id:guid}/active")]
    [RequirePermission(Permissions.UserManage)]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest req)
    {
        var ok = await userService.SetActiveAsync(id, req.IsActive);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission(Permissions.UserManage)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await userService.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    private static object MapUser(Core.Entities.User user, IAvatarService avatarService) => new
    {
        user.Id,
        user.Pseudo,
        user.Email,
        Role = user.Role.Name.ToString(),
        EffectivePermissions = user.GetEffectivePermissions(),
        user.ExtraPermissions,
        user.RevokedPermissions,
        user.IsActive,
        user.CreatedAt,
        user.LastLoginAt,
        AvatarUrl = user.AvatarKey is not null ? avatarService.GetAvatarUrl(user.AvatarKey) : null
    };
}

public record UpdateProfileRequest(string? Pseudo, string? Email, string? Password);
public record SetRoleRequest(int RoleId);
public record SetPermissionsRequest(string[]? ExtraPermissions, string[]? RevokedPermissions);
public record SetActiveRequest(bool IsActive);
