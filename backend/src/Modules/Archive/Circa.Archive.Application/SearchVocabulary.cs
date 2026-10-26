namespace Circa.Archive.Application;

public sealed record SearchVocabularyMatch(string Key, string Value);

public static class SearchVocabulary
{
    private static readonly (string Key, string Value, string English, string Korean)[] Entries =
    [
        ("type", "incident", "Incident", "사건"),
        ("type", "record", "Record", "기록"),
        ("type", "organization", "Organization", "조직"),
        ("type", "character", "Character", "인물"),
        ("type", "recovery", "Recovery", "회수 기록"),
        ("class", "exploration", "Exploration", "탐사"),
        ("class", "evidence", "Evidence", "증거"),
        ("class", "rumour", "Rumour", "소문"),
        ("status", "on-file", "On file", "등록됨"),
        ("status", "contested", "Contested", "논쟁 중"),
        ("status", "sealed", "Sealed", "봉인됨"),
        ("status", "restricted", "Restricted", "열람 제한"),
        ("status", "erased", "Erased", "말소됨"),
        ("status", "tombstoned", "Tombstoned", "삭제 기록"),
        ("warn", "red", "Red", "빨강"),
        ("warn", "yellow", "Yellow", "노랑"),
        ("warn", "green", "Green", "초록"),
        ("disclosure", "none", "Author chose not to warn", "작성자가 경고를 선택하지 않음"),
        ("disclosure", "no-warnings-apply", "No warnings apply", "적용되는 경고 없음"),
        ("disclosure", "not-provided", "Warnings not provided", "경고 정보 미제공"),
        ("warnTag", "graphic-violence", "Graphic violence", "노골적인 폭력"),
        ("warnTag", "psychological-horror", "Psychological horror", "심리적 공포"),
        ("warnTag", "sexual-violence", "Sexual violence", "성폭력"),
        ("warnTag", "self-harm", "Self-harm", "자해"),
        ("warnTag", "major-character-death", "Major character death", "주요 인물 사망")
    ];

    public static SearchVocabularyMatch? Resolve(string query, string language)
    {
        foreach (var entry in Entries)
            if (string.Equals(query.Trim(), language == "ko" ? entry.Korean : entry.English, StringComparison.OrdinalIgnoreCase)
                || string.Equals(query.Trim(), entry.Value, StringComparison.OrdinalIgnoreCase))
                return new(entry.Key, entry.Value);
        return null;
    }
}
