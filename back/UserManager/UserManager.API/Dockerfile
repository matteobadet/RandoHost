FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["UserManager.API/UserManager.API.csproj", "UserManager.API/"]
COPY ["UserManager.Core/UserManager.Core.csproj", "UserManager.Core/"]
COPY ["UserManager.Infrastructure/UserManager.Infrastructure.csproj", "UserManager.Infrastructure/"]
RUN dotnet restore "UserManager.API/UserManager.API.csproj"
COPY . .
RUN dotnet build "UserManager.API/UserManager.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "UserManager.API/UserManager.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "UserManager.API.dll"]
