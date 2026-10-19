# Stage 1: Runtime base
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
USER $APP_UID

# Stage 2: SDK build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy solution and configuration files
COPY ["Directory.Build.props", "./"]
COPY ["Directory.Packages.props", "./"]
COPY ["Circa.sln", "./"]

# Copy project definition files for layer caching
COPY ["src/Circa.Api/Circa.Api.csproj", "src/Circa.Api/"]
COPY ["src/Common/Circa.Common.Domain/Circa.Common.Domain.csproj", "src/Common/Circa.Common.Domain/"]
COPY ["src/Common/Circa.Common.Application/Circa.Common.Application.csproj", "src/Common/Circa.Common.Application/"]
COPY ["src/Common/Circa.Common.Infrastructure/Circa.Common.Infrastructure.csproj", "src/Common/Circa.Common.Infrastructure/"]
COPY ["src/Modules/Auth/Circa.Auth.Domain/Circa.Auth.Domain.csproj", "src/Modules/Auth/Circa.Auth.Domain/"]
COPY ["src/Modules/Auth/Circa.Auth.Application/Circa.Auth.Application.csproj", "src/Modules/Auth/Circa.Auth.Application/"]
COPY ["src/Modules/Auth/Circa.Auth.Infrastructure/Circa.Auth.Infrastructure.csproj", "src/Modules/Auth/Circa.Auth.Infrastructure/"]
COPY ["src/Modules/Auth/Circa.Auth.Contracts/Circa.Auth.Contracts.csproj", "src/Modules/Auth/Circa.Auth.Contracts/"]
COPY ["tests/Circa.Api.IntegrationTests/Circa.Api.IntegrationTests.csproj", "tests/Circa.Api.IntegrationTests/"]
COPY ["tests/Circa.Modules.Auth.Tests/Circa.Modules.Auth.Tests.csproj", "tests/Circa.Modules.Auth.Tests/"]

# Restore packages
RUN dotnet restore "Circa.sln"

# Copy source code and build
COPY . .
WORKDIR "/src/src/Circa.Api"
RUN dotnet build "Circa.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build --no-restore

# Stage 3: Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Circa.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false --no-restore

# Stage 4: Production image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Circa.Api.dll"]
