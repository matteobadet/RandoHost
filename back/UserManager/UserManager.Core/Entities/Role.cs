namespace UserManager.Core.Entities;

public enum RoleName { Admin, Contributor, ReadOnly }

public class Role
{
    public int Id { get; set; }
    public RoleName Name { get; set; }
    public string[] DefaultPermissions { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
}

public static class Permissions
{
    public const string MediaView      = "media.view";
    public const string MediaUpload    = "media.upload";
    public const string MediaEditOwn   = "media.edit_own";
    public const string MediaDeleteOwn = "media.delete_own";
    public const string MediaEditAny   = "media.edit_any";
    public const string MediaDeleteAny = "media.delete_any";
    public const string AlbumManage    = "album.manage";
    public const string UserManage     = "user.manage";

    public static readonly string[] AdminDefaults =
    [
        MediaView, MediaUpload, MediaEditOwn, MediaDeleteOwn,
        MediaEditAny, MediaDeleteAny, AlbumManage, UserManage
    ];

    public static readonly string[] ContributorDefaults =
    [
        MediaView, MediaUpload, MediaEditOwn, MediaDeleteOwn
    ];

    public static readonly string[] ReadOnlyDefaults =
    [
        MediaView
    ];
}
