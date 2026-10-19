# Circa.Api

## Responsibility

Acts as the executable entry point and composition root for the CIRCA backend. Responsible for configuring HTTP pipeline middleware, dependency injection, environment settings, authentication/authorization schemes, and mapping endpoints.

## Structure

- `Program.cs`: Application bootstrap, middleware pipeline, service composition, and route mapping.
- `appsettings.json` and `appsettings.Development.json`: Configuration definitions for logging, database connection strings, and security settings.
- `Properties/launchSettings.json`: Local development launch profiles.

## Boundaries

`Circa.Api` coordinates module registration and exposes their endpoints. It does not implement domain logic, direct database tables, or business rules. It references `Circa.Common.Infrastructure`, module `Infrastructure` projects (to invoke module service extensions), and module `Contracts` projects.

## Usage

Run the web host locally:

```sh
dotnet run --project src/Circa.Api
```
