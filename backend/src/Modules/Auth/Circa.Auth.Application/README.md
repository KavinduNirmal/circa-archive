# Circa.Auth.Application

## Responsibility

Orchestrates authentication use cases: user registration, credential verification, session management, and refresh token validation algorithms.

## Structure

References `Circa.Auth.Domain` and `Circa.Common.Application`. Contains command and query handlers, input validation, and service contracts for hashing and token generation.

## Boundaries

Coordinates domain entities and application services. Does not depend directly on database implementations, HTTP controllers, or web contexts.
