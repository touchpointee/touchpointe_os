# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["Touchpointe.sln", "./"]
COPY ["src/Touchpointe.API/Touchpointe.API.csproj", "src/Touchpointe.API/"]
COPY ["src/Touchpointe.Application/Touchpointe.Application.csproj", "src/Touchpointe.Application/"]
COPY ["src/Touchpointe.Domain/Touchpointe.Domain.csproj", "src/Touchpointe.Domain/"]
COPY ["src/Touchpointe.Infrastructure/Touchpointe.Infrastructure.csproj", "src/Touchpointe.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/Touchpointe.API/Touchpointe.API.csproj"

# Copy full source code
COPY . .

# Build and Publish
WORKDIR "/src/src/Touchpointe.API"
RUN dotnet publish "Touchpointe.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .

# Environment Defaults inside Container
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Touchpointe.API.dll"]
