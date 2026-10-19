using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Circa.Api.IntegrationTests;

public sealed class TestLogSink : ILoggerProvider, ILogger
{
    private static readonly ConcurrentBag<string> _logs = new();

    public static IReadOnlyCollection<string> Logs => _logs;

    public static void Clear() => _logs.Clear();

    public ILogger CreateLogger(string categoryName) => this;

    public void Dispose() { }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        _logs.Add(formatter(state, exception));
    }
}
