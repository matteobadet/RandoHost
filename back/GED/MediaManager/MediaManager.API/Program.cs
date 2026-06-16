using Amazon.S3;
using MediaManager.API.Options;
using MediaManager.API.Services;
using MediaManager.Core.Interfaces;
using MediaManager.Infrastructure.Data;
using MediaManager.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(
        "http://localhost:5173",  // Vite dev
        "http://localhost",       // Docker front (port 80)
        "http://localhost:80",
        "app://."                 // Electron prod
    )
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// PostgreSQL + PostGIS
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(
        builder.Configuration.GetConnectionString("Default"),
        o => o.UseNetTopologySuite()));

// MinIO (compatible S3)
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection("Storage"));
builder.Services.AddSingleton<IAmazonS3>(_ =>
{
    var opts = builder.Configuration.GetSection("Storage").Get<StorageOptions>()!;
    var config = new AmazonS3Config
    {
        ServiceURL = opts.Endpoint,
        ForcePathStyle = true
    };
    return new AmazonS3Client(opts.AccessKey, opts.SecretKey, config);
});

// Services
builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<ExifService>();
builder.Services.AddScoped<MediaProcessor>();

// Repositories
builder.Services.AddScoped<IMediaRepository, MediaRepository>();
builder.Services.AddScoped<IAlbumRepository, AlbumRepository>();

var app = builder.Build();

// Auto-migration au démarrage
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.Run();
