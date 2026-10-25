using System.Text;
using Circa.Archive.Domain;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Circa.Archive.Infrastructure.Persistence;

internal static class ArchiveValueConverters
{
    public static readonly ValueConverter<RecordType, string> RecordType = new(
        value => ToRecordTypeValue(value),
        value => FromRecordTypeValue(value));

    public static ValueConverter<TEnum, string> SnakeCase<TEnum>()
        where TEnum : struct, Enum
    {
        var toProvider = Enum.GetValues<TEnum>()
            .ToDictionary(value => value, value => ToSnakeCase(value.ToString()));
        var fromProvider = toProvider.ToDictionary(pair => pair.Value, pair => pair.Key);

        return new ValueConverter<TEnum, string>(
            value => toProvider[value],
            value => fromProvider[value]);
    }

    private static string ToRecordTypeValue(RecordType value) => value switch
    {
        Domain.RecordType.Exploration => "EXP",
        Domain.RecordType.Evidence => "EVI",
        Domain.RecordType.Rumour => "RUM",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
    };

    private static RecordType FromRecordTypeValue(string value) => value switch
    {
        "EXP" => Domain.RecordType.Exploration,
        "EVI" => Domain.RecordType.Evidence,
        "RUM" => Domain.RecordType.Rumour,
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null)
    };

    private static string ToSnakeCase(string value)
    {
        var builder = new StringBuilder(value.Length + 4);
        for (var index = 0; index < value.Length; index++)
        {
            var character = value[index];
            if (char.IsUpper(character))
            {
                if (index > 0)
                {
                    builder.Append('_');
                }

                builder.Append(char.ToLowerInvariant(character));
                continue;
            }

            builder.Append(character);
        }

        return builder.ToString();
    }
}
