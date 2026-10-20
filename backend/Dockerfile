FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV HOME=/home/app
# Persist refresh-token protection keys without running the API as root.
RUN mkdir -p /home/app/.aspnet/DataProtection-Keys && chown -R "$APP_UID" /home/app/.aspnet
USER $APP_UID

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props Directory.Packages.props ./
COPY src/Circa.Api/Circa.Api.csproj src/Circa.Api/
COPY src/Common/Circa.Common.Domain/Circa.Common.Domain.csproj src/Common/Circa.Common.Domain/
COPY src/Common/Circa.Common.Application/Circa.Common.Application.csproj src/Common/Circa.Common.Application/
COPY src/Common/Circa.Common.Infrastructure/Circa.Common.Infrastructure.csproj src/Common/Circa.Common.Infrastructure/
COPY src/Modules/Auth/Circa.Auth.Domain/Circa.Auth.Domain.csproj src/Modules/Auth/Circa.Auth.Domain/
COPY src/Modules/Auth/Circa.Auth.Application/Circa.Auth.Application.csproj src/Modules/Auth/Circa.Auth.Application/
COPY src/Modules/Auth/Circa.Auth.Infrastructure/Circa.Auth.Infrastructure.csproj src/Modules/Auth/Circa.Auth.Infrastructure/
COPY src/Modules/Auth/Circa.Auth.Contracts/Circa.Auth.Contracts.csproj src/Modules/Auth/Circa.Auth.Contracts/
RUN dotnet restore src/Circa.Api/Circa.Api.csproj
COPY src/ ./src/
RUN dotnet publish src/Circa.Api/Circa.Api.csproj -c Release -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Circa.Api.dll"]
