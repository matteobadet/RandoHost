FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MediaManager.API/MediaManager.API.csproj", "MediaManager.API/"]
COPY ["MediaManager.Core/MediaManager.Core.csproj", "MediaManager.Core/"]
COPY ["MediaManager.Infrastructure/MediaManager.Infrastructure.csproj", "MediaManager.Infrastructure/"]
RUN dotnet restore "MediaManager.API/MediaManager.API.csproj"
COPY . .
RUN dotnet build "MediaManager.API/MediaManager.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MediaManager.API/MediaManager.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MediaManager.API.dll"]
