# Launch Settings

## Responsibility

Holds development launch profiles and environment variables for local testing and debugging of `Circa.Api`.

## Structure

- `launchSettings.json`: Profiles configuring ports, SSL options, and default environment flags for `dotnet run` and IDE debuggers.

## Boundaries

Contains tooling configuration only. No application code, secrets, or production environment values belong here.
