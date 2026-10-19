# Circa.Auth.Contracts

## Responsibility

Defines the public surface of the Auth module consumed by other modules and the host: user summaries, directory lookup interfaces (`IUserDirectory`), policy names, and authorization requirements.

## Structure

References `Circa.Common.Application`. Contains immutable records, identifiers (`UserId`), and interfaces.

## Boundaries

This is the only Auth module project that other feature modules (such as `Records`) may reference. It contains no persistence code, no sensitive credentials, and no domain business logic.
