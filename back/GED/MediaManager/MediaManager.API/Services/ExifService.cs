using System.Text.Json;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;
using NetTopologySuite.Geometries;

namespace MediaManager.API.Services;

public record ExifData(DateTime? TakenAt, Point? GpsPoint, JsonDocument? Raw);

public class ExifService
{
    public ExifData Extract(Stream stream)
    {
        try
        {
            var directories = ImageMetadataReader.ReadMetadata(stream);
            var exif = directories.OfType<ExifSubIfdDirectory>().FirstOrDefault();
            var gps = directories.OfType<GpsDirectory>().FirstOrDefault();

            DateTime? takenAt = null;
            if (exif?.TryGetDateTime(ExifDirectoryBase.TagDateTimeOriginal, out var dt) == true)
                takenAt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);

            Point? point = null;
            var location = gps?.GetGeoLocation();
            if (location != null)
                point = new Point(location.Longitude, location.Latitude) { SRID = 4326 };

            var raw = directories
                .SelectMany(d => d.Tags)
                .ToDictionary(t => t.Name, t => (object?)t.Description);
            var json = JsonSerializer.SerializeToDocument(raw);

            return new ExifData(takenAt, point, json);
        }
        catch
        {
            return new ExifData(null, null, null);
        }
    }
}
