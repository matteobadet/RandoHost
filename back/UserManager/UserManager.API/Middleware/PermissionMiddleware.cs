using System.Security.Claims;

namespace UserManager.API.Middleware;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute(string permission) : Attribute
{
    public string Permission { get; } = permission;
}

public class PermissionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var attr = endpoint?.Metadata.GetMetadata<RequirePermissionAttribute>();

        if (attr is not null)
        {
            if (context.User.Identity?.IsAuthenticated != true)
            {
                context.Response.StatusCode = 401;
                return;
            }

            var permissions = context.User.FindAll("permission").Select(c => c.Value);
            if (!permissions.Contains(attr.Permission))
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = $"Permission requise : {attr.Permission}" });
                return;
            }
        }

        await next(context);
    }
}
