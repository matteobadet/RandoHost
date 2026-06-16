using System.Security.Cryptography;
using System.Text;

namespace UserManager.API.Services;

public static class HashService
{
    public static string Sha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static bool Verify(string input, string hash) =>
        Sha256(input) == hash;
}
