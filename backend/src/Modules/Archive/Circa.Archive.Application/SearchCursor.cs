using System.Text.Json;
using System.IO.Compression;
using System.Text.Encodings.Web;

namespace Circa.Archive.Application;

public sealed record SearchCursor(string Sort, DateTimeOffset FiledAt, Guid Id, double Score, string Title, int Page, SearchCursor? Previous = null);

public static class SearchCursorCodec
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

    public static string Encode(SearchCursor cursor)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(cursor, JsonOptions);
        using var compressed = new MemoryStream();
        using (var compressor = new BrotliStream(compressed, CompressionLevel.SmallestSize, leaveOpen: true))
            compressor.Write(bytes);
        return Convert.ToBase64String(compressed.ToArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TryDecode(string value, out SearchCursor? cursor)
    {
        cursor = null;
        try
        {
            var base64 = value.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
            using var compressed = new MemoryStream(Convert.FromBase64String(base64));
            using var decompressor = new BrotliStream(compressed, CompressionMode.Decompress);
            // Reject oversized decompressed input before deserialization.
            var bytes = new byte[8193];
            var length = decompressor.ReadAtLeast(bytes, bytes.Length, throwOnEndOfStream: false);
            if (length > 8192) return false;
            var parsed = JsonSerializer.Deserialize<SearchCursor>(bytes.AsSpan(0, length), JsonOptions);
            if (parsed is null || !ValidBoundary(parsed) || parsed.Page < 2 || parsed.Page > 100 ||
                parsed.Previous is { } previous && (previous.Previous is not null || !ValidBoundary(previous) || previous.Page != parsed.Page - 1 || previous.Sort != parsed.Sort)) return false;
            cursor = parsed;
            return true;
        }
        catch (Exception error) when (error is FormatException or JsonException or ArgumentException or InvalidDataException or InvalidOperationException)
        {
            return false;
        }
    }

    private static bool ValidBoundary(SearchCursor cursor) =>
        (cursor.Sort is "relevance" or "newest" or "oldest" or "title") &&
        cursor.Id != Guid.Empty && cursor.FiledAt != default &&
        double.IsFinite(cursor.Score) && !string.IsNullOrEmpty(cursor.Title) && cursor.Title.Length <= 256;
}
