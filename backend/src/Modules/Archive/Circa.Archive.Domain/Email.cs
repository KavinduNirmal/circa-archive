namespace Circa.Archive.Domain;

/// <summary>In-world mail delivered to an account's desktop client.</summary>
public sealed class Email
{
    /// <summary>UUIDv7 primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Sender address shown to the reader.</summary>
    public string FromAddress { get; set; } = string.Empty;

    /// <summary>Recipient account.</summary>
    public Guid ToUserId { get; set; }

    /// <summary>Subject line.</summary>
    public string Subject { get; set; } = string.Empty;

    /// <summary>Markdown body.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>JSON attachment descriptors; null when there are none.</summary>
    public string? Attachments { get; set; }

    /// <summary>Routing category that determines which mailbox view shows it.</summary>
    public EmailType Type { get; set; }

    /// <summary>Folder it was automatically filed into; null when left in the inbox.</summary>
    public Guid? FiledIntoFolderId { get; set; }

    /// <summary>Whether the recipient has opened it.</summary>
    public bool IsRead { get; set; }

    /// <summary>Delivery time in UTC.</summary>
    public DateTimeOffset CreatedAt { get; set; }

    public Folder? FiledIntoFolder { get; set; }
}
