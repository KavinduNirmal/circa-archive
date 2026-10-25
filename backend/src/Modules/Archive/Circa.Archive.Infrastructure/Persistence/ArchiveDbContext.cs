using Circa.Archive.Domain;
using Microsoft.EntityFrameworkCore;
using NpgsqlTypes;

namespace Circa.Archive.Infrastructure.Persistence;

public sealed class ArchiveDbContext(DbContextOptions<ArchiveDbContext> options) : DbContext(options)
{
    public DbSet<Incident> Incidents => Set<Incident>();

    public DbSet<Record> Records => Set<Record>();

    public DbSet<RecordTag> RecordTags => Set<RecordTag>();

    public DbSet<Organization> Organizations => Set<Organization>();

    public DbSet<Character> Characters => Set<Character>();

    public DbSet<Recovery> Recoveries => Set<Recovery>();

    public DbSet<IncidentDesignation> IncidentDesignations => Set<IncidentDesignation>();

    public DbSet<IncidentRevision> IncidentRevisions => Set<IncidentRevision>();

    public DbSet<RecordRevision> RecordRevisions => Set<RecordRevision>();

    public DbSet<RecordAssessment> RecordAssessments => Set<RecordAssessment>();

    public DbSet<RecordAccessRequest> RecordAccessRequests => Set<RecordAccessRequest>();

    public DbSet<Playlist> Playlists => Set<Playlist>();

    public DbSet<PlaylistItem> PlaylistItems => Set<PlaylistItem>();

    public DbSet<OrganizationModerator> OrganizationModerators => Set<OrganizationModerator>();

    public DbSet<OrganizationRevision> OrganizationRevisions => Set<OrganizationRevision>();

    public DbSet<OrganizationVote> OrganizationVotes => Set<OrganizationVote>();

    public DbSet<OrgMention> OrgMentions => Set<OrgMention>();

    public DbSet<Recognition> Recognitions => Set<Recognition>();

    public DbSet<CharacterImport> CharacterImports => Set<CharacterImport>();

    public DbSet<Draft> Drafts => Set<Draft>();

    public DbSet<TemporaryEntity> TemporaryEntities => Set<TemporaryEntity>();

    public DbSet<EntityLink> EntityLinks => Set<EntityLink>();

    public DbSet<Tombstone> Tombstones => Set<Tombstone>();

    public DbSet<ModerationLog> ModerationLogs => Set<ModerationLog>();

    public DbSet<ModerationAppeal> ModerationAppeals => Set<ModerationAppeal>();

    public DbSet<Email> Emails => Set<Email>();

    public DbSet<Folder> Folders => Set<Folder>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("archive");
        builder.HasPostgresExtension("pg_trgm");

        ConfigureIncidents(builder);
        ConfigureOrganizations(builder);
        ConfigureRecords(builder);
        ConfigureRecordTags(builder);
        ConfigureCharacters(builder);
        ConfigureRecoveries(builder);
        ConfigureSupportingEntities(builder);
    }

    private static void ConfigureIncidents(ModelBuilder builder)
    {
        builder.Entity<Incident>(b =>
        {
            b.ToTable("incidents", table =>
            {
                table.HasCheckConstraint(
                    "ck_incidents_classification",
                    "classification IS NULL OR classification BETWEEN 3 AND 6");
                table.HasCheckConstraint("ck_incidents_reference_number", "reference_number >= 0");
            });

            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.ReferenceNumber).HasColumnName("reference_number");
            b.Property(x => x.Severity).HasColumnName("severity").HasMaxLength(2).HasConversion<string>();
            b.Property(x => x.Designation).HasColumnName("designation").HasMaxLength(256).IsRequired();
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.AuthorId).HasColumnName("author_id");
            b.Property(x => x.AuthorAffiliationOrgId).HasColumnName("author_affiliation_org_id");
            b.Property(x => x.ClaimOrgId).HasColumnName("claim_org_id");
            b.Property(x => x.AccessPolicy).HasColumnName("access_policy").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<AccessPolicy>());
            b.Property(x => x.Classification).HasColumnName("classification");
            b.Property(x => x.WarningTier).HasColumnName("warning_tier").HasMaxLength(10)
                .HasConversion(ArchiveValueConverters.SnakeCase<WarningTier>());
            b.Property(x => x.WarningDisclosure).HasColumnName("warning_disclosure").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<WarningDisclosure>());
            b.Property(x => x.WarningTags).HasColumnName("warning_tags").HasColumnType("text[]");
            b.Property(x => x.HolderCode).HasColumnName("holder_code").HasMaxLength(40);
            b.Property(x => x.RecordStatus).HasColumnName("record_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RecordStatus>());
            b.Property(x => x.ContentHash).HasColumnName("content_hash").HasMaxLength(64).IsRequired();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            b.HasOne(x => x.AuthorAffiliationOrganization)
                .WithMany(x => x.AuthoredIncidents)
                .HasForeignKey(x => x.AuthorAffiliationOrgId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.ClaimOrganization)
                .WithMany(x => x.ClaimedIncidents)
                .HasForeignKey(x => x.ClaimOrgId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(x => x.ReferenceNumber)
                .IsUnique()
                .HasDatabaseName("ux_incidents_reference_number");
            b.HasIndex(x => x.ContentHash).HasDatabaseName("ix_incidents_content_hash");
            b.HasIndex(x => x.Designation)
                .HasDatabaseName("ix_incidents_designation_trgm")
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");
            b.HasIndex(x => new { x.RecordStatus, x.AccessPolicy, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_incidents_feed")
                .IsDescending(false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.AuthorId, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_incidents_author_feed")
                .IsDescending(false, true, false);
            b.HasIndex(x => x.AuthorAffiliationOrgId)
                .HasDatabaseName("ix_incidents_affiliation")
                .HasFilter("\"author_affiliation_org_id\" IS NOT NULL");
            b.HasIndex(x => x.ClaimOrgId)
                .HasDatabaseName("ix_incidents_claim")
                .HasFilter("\"claim_org_id\" IS NOT NULL");
            b.HasIndex(x => x.WarningTags)
                .HasDatabaseName("ix_incidents_warning_tags")
                .HasMethod("gin")
                .HasOperators("array_ops");

            b.Property<NpgsqlTsVector>("SearchVector")
                .HasColumnName("search_vector")
                .HasComputedColumnSql(
                    "to_tsvector('english', coalesce(designation, '') || ' ' || coalesce(markdown, ''))",
                    stored: true);
            b.HasIndex("SearchVector")
                .HasDatabaseName("ix_incidents_search_vector")
                .HasMethod("gin");
        });
    }

    private static void ConfigureOrganizations(ModelBuilder builder)
    {
        builder.Entity<Organization>(b =>
        {
            b.ToTable("organizations", table =>
                table.HasCheckConstraint("ck_organizations_reference_number", "reference_number >= 0"));

            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.ReferenceNumber).HasColumnName("reference_number");
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            b.Property(x => x.EstablishedYear).HasColumnName("established_year");
            b.Property(x => x.RecognizedYear).HasColumnName("recognized_year");
            b.Property(x => x.RecognitionState).HasColumnName("recognition_state").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RecognitionState>());
            b.Property(x => x.FiledById).HasColumnName("filed_by_id");
            b.Property(x => x.FiledAt).HasColumnName("filed_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            b.Property(x => x.GeographicInfluence).HasColumnName("geographic_influence");
            b.Property(x => x.PersonnelCount).HasColumnName("personnel_count");
            b.Property(x => x.LogoObjectKey).HasColumnName("logo_object_key");
            b.Property(x => x.Gallery).HasColumnName("gallery").HasColumnType("jsonb").IsRequired();
            b.Property(x => x.OrganizationType).HasColumnName("organization_type").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<OrganizationType>());
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.SeverityWords).HasColumnName("severity_words").HasColumnType("jsonb").IsRequired();
            b.Property(x => x.EmailLocalPart).HasColumnName("email_local_part").HasMaxLength(64);
            b.Property(x => x.HolderCodeFormat).HasColumnName("holder_code_format").HasColumnType("jsonb");
            b.Property(x => x.RecordStatus).HasColumnName("record_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RecordStatus>());
            b.Property(x => x.VoteScore).HasColumnName("vote_score").HasDefaultValue(0);
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

            b.HasIndex(x => x.ReferenceNumber)
                .IsUnique()
                .HasDatabaseName("ux_organizations_reference_number");
            b.HasIndex(x => x.Name)
                .HasDatabaseName("ix_organizations_name_trgm")
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");
            b.HasIndex(x => new { x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_organizations_recent")
                .IsDescending(false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.RecognitionState, x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_organizations_directory")
                .IsDescending(false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.FiledById, x.FiledAt, x.Id })
                .HasDatabaseName("ix_organizations_filed_by")
                .IsDescending(false, true, false);
        });
    }

    private static void ConfigureRecords(ModelBuilder builder)
    {
        builder.Entity<Record>(b =>
        {
            b.ToTable("records", table =>
            {
                table.HasCheckConstraint(
                    "ck_records_classification",
                    "classification IS NULL OR classification BETWEEN 3 AND 6");
                table.HasCheckConstraint("ck_records_reference_number", "reference_number >= 0");
                table.HasCheckConstraint(
                    "ck_records_code",
                    "(record_type = 'RUM' AND code IS NULL) OR (record_type <> 'RUM' AND code IS NOT NULL)");
            });

            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.RecordType).HasColumnName("record_type").HasMaxLength(10)
                .HasConversion(ArchiveValueConverters.RecordType);
            b.Property(x => x.ReferenceNumber).HasColumnName("reference_number");
            b.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            b.Property(x => x.IncidentId).HasColumnName("incident_id");
            b.Property(x => x.AuthorId).HasColumnName("author_id");
            b.Property(x => x.AuthorAffiliationOrgId).HasColumnName("author_affiliation_org_id");
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.FollowsRecordId).HasColumnName("follows_record_id");
            b.Property(x => x.AccessPolicy).HasColumnName("access_policy").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<AccessPolicy>());
            b.Property(x => x.Classification).HasColumnName("classification");
            b.Property(x => x.WarningTier).HasColumnName("warning_tier").HasMaxLength(10)
                .HasConversion(ArchiveValueConverters.SnakeCase<WarningTier>());
            b.Property(x => x.WarningDisclosure).HasColumnName("warning_disclosure").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<WarningDisclosure>());
            b.Property(x => x.WarningTags).HasColumnName("warning_tags").HasColumnType("text[]");
            b.Property(x => x.HolderCode).HasColumnName("holder_code").HasMaxLength(40);
            b.Property(x => x.RecordStatus).HasColumnName("record_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RecordStatus>());
            b.Property(x => x.ContentHash).HasColumnName("content_hash").HasMaxLength(64).IsRequired();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            b.HasOne(x => x.Incident)
                .WithMany(x => x.Records)
                .HasForeignKey(x => x.IncidentId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.AuthorAffiliationOrganization)
                .WithMany(x => x.AuthoredRecords)
                .HasForeignKey(x => x.AuthorAffiliationOrgId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.FollowsRecord)
                .WithMany(x => x.FollowedByRecords)
                .HasForeignKey(x => x.FollowsRecordId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(x => new { x.RecordType, x.ReferenceNumber })
                .IsUnique()
                .HasDatabaseName("ux_records_type_reference_number");
            b.HasIndex(x => x.Code)
                .IsUnique()
                .HasDatabaseName("ux_records_code")
                .HasFilter("\"code\" IS NOT NULL");
            b.HasIndex(x => x.ContentHash).HasDatabaseName("ix_records_content_hash");
            b.HasIndex(x => new { x.RecordStatus, x.AccessPolicy, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_records_recent")
                .IsDescending(false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.RecordType, x.RecordStatus, x.AccessPolicy, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_records_feed")
                .IsDescending(false, false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.IncidentId, x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_records_incident_filings")
                .IsDescending(false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.IncidentId, x.RecordType, x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_records_incident_type_filings")
                .IsDescending(false, false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.AuthorId, x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_records_author_feed")
                .IsDescending(false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.AuthorAffiliationOrgId, x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_records_affiliation_feed")
                .IsDescending(false, false, true, false)
                .HasFilter("\"author_affiliation_org_id\" IS NOT NULL AND \"record_status\" = 'on_file'");
            b.HasIndex(x => x.FollowsRecordId)
                .HasDatabaseName("ix_records_follows")
                .HasFilter("\"follows_record_id\" IS NOT NULL");
            b.HasIndex(x => x.WarningTags)
                .HasDatabaseName("ix_records_warning_tags")
                .HasMethod("gin")
                .HasOperators("array_ops");

            b.Property<NpgsqlTsVector>("SearchVector")
                .HasColumnName("search_vector")
                .HasComputedColumnSql(
                    "to_tsvector('english', coalesce(markdown, ''))",
                    stored: true);
            b.HasIndex("SearchVector")
                .HasDatabaseName("ix_records_search_vector")
                .HasMethod("gin");
        });
    }

    private static void ConfigureRecordTags(ModelBuilder builder)
    {
        builder.Entity<RecordTag>(b =>
        {
            b.ToTable("record_tags");
            b.HasKey(x => new { x.RecordId, x.Tag });
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.Tag).HasColumnName("tag").HasMaxLength(64);
            b.HasOne(x => x.Record)
                .WithMany(x => x.Tags)
                .HasForeignKey(x => x.RecordId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.Tag, x.RecordId }).HasDatabaseName("ix_record_tags_tag_record");
        });
    }

    private static void ConfigureCharacters(ModelBuilder builder)
    {
        builder.Entity<Character>(b =>
        {
            b.ToTable("characters", table =>
                table.HasCheckConstraint("ck_characters_reference_number", "reference_number >= 0"));

            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.ReferenceNumber).HasColumnName("reference_number");
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            b.Property(x => x.Metadata).HasColumnName("metadata").HasColumnType("jsonb").IsRequired();
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.CreatedById).HasColumnName("created_by_id");
            b.Property(x => x.UsagePolicy).HasColumnName("usage_policy").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<CharacterUsage>());
            b.Property(x => x.RecordStatus).HasColumnName("record_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RecordStatus>());
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            b.HasIndex(x => x.ReferenceNumber)
                .IsUnique()
                .HasDatabaseName("ux_characters_reference_number");
            b.HasIndex(x => x.Name)
                .HasDatabaseName("ix_characters_name_trgm")
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");
            b.HasIndex(x => new { x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_characters_recent")
                .IsDescending(false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.UsagePolicy, x.RecordStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_characters_directory")
                .IsDescending(false, false, true, false)
                .HasFilter("\"record_status\" = 'on_file'");
            b.HasIndex(x => new { x.CreatedById, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_characters_created_by")
                .IsDescending(false, true, false);
        });
    }

    private static void ConfigureRecoveries(ModelBuilder builder)
    {
        builder.Entity<Recovery>(b =>
        {
            b.ToTable("recoveries", table =>
                table.HasCheckConstraint("ck_recoveries_reference_number", "reference_number >= 0"));

            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.ReferenceNumber).HasColumnName("reference_number");
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            b.Property(x => x.AlternativeNames).HasColumnName("alternative_names").HasColumnType("text[]");
            b.Property(x => x.Category).HasColumnName("category").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RecoveryCategory>());
            b.Property(x => x.Description).HasColumnName("description").IsRequired();
            b.Property(x => x.OriginIncidentId).HasColumnName("origin_incident_id");
            b.Property(x => x.FirstDocumentedRecordId).HasColumnName("first_documented_record_id");
            b.Property(x => x.RegisteredById).HasColumnName("registered_by_id");
            b.Property(x => x.DocumentationStatus).HasColumnName("documentation_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<DocumentationStatus>());
            b.Property(x => x.RegistryStatus).HasColumnName("registry_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<RegistryStatus>());
            b.Property(x => x.Metadata).HasColumnName("metadata").HasColumnType("jsonb").IsRequired();
            b.Property(x => x.Gallery).HasColumnName("gallery").HasColumnType("jsonb").IsRequired();
            b.Property(x => x.FirstRecoveredByCharacterId).HasColumnName("first_recovered_by_character_id");
            b.Property(x => x.FirstRecoveredByOrgId).HasColumnName("first_recovered_by_org_id");
            b.Property(x => x.CurrentCustodianCharacterId).HasColumnName("current_custodian_character_id");
            b.Property(x => x.CurrentCustodianOrgId).HasColumnName("current_custodian_org_id");
            b.Property(x => x.CustodyStatus).HasColumnName("custody_status").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<CustodyStatus>());
            b.Property(x => x.Reproducibility).HasColumnName("reproducibility").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<Reproducibility>());
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

            b.HasOne(x => x.OriginIncident)
                .WithMany(x => x.OriginRecoveries)
                .HasForeignKey(x => x.OriginIncidentId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.FirstDocumentedRecord)
                .WithMany(x => x.FirstDocumentedRecoveries)
                .HasForeignKey(x => x.FirstDocumentedRecordId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.FirstRecoveredByCharacter)
                .WithMany(x => x.FirstRecovered)
                .HasForeignKey(x => x.FirstRecoveredByCharacterId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.FirstRecoveredByOrganization)
                .WithMany(x => x.FirstRecovered)
                .HasForeignKey(x => x.FirstRecoveredByOrgId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.CurrentCustodianCharacter)
                .WithMany(x => x.Custodied)
                .HasForeignKey(x => x.CurrentCustodianCharacterId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.CurrentCustodianOrganization)
                .WithMany(x => x.Custodied)
                .HasForeignKey(x => x.CurrentCustodianOrgId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(x => x.ReferenceNumber)
                .IsUnique()
                .HasDatabaseName("ux_recoveries_reference_number");
            b.HasIndex(x => x.Name)
                .HasDatabaseName("ix_recoveries_name_trgm")
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");
            b.HasIndex(x => x.AlternativeNames)
                .HasDatabaseName("ix_recoveries_alternative_names")
                .HasMethod("gin")
                .HasOperators("array_ops");
            b.HasIndex(x => new { x.RegistryStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_recoveries_recent")
                .IsDescending(false, true, false);
            b.HasIndex(x => new { x.RegistryStatus, x.Category, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_recoveries_directory")
                .IsDescending(false, false, true, false);
            b.HasIndex(x => new { x.CustodyStatus, x.RegistryStatus, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_recoveries_custody")
                .IsDescending(false, false, true, false);
            b.HasIndex(x => x.OriginIncidentId)
                .HasDatabaseName("ix_recoveries_origin_incident")
                .HasFilter("\"origin_incident_id\" IS NOT NULL");
            b.HasIndex(x => x.FirstDocumentedRecordId)
                .HasDatabaseName("ix_recoveries_first_documented")
                .HasFilter("\"first_documented_record_id\" IS NOT NULL");
            b.HasIndex(x => new { x.RegisteredById, x.CreatedAt, x.Id })
                .HasDatabaseName("ix_recoveries_registered_by")
                .IsDescending(false, true, false);
        });
    }
    private static void ConfigureSupportingEntities(ModelBuilder builder)
    {
        builder.Entity<IncidentDesignation>(b =>
        {
            b.ToTable("incident_designations");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.IncidentId).HasColumnName("incident_id");
            b.Property(x => x.OrgId).HasColumnName("org_id");
            b.Property(x => x.Label).HasColumnName("label").HasMaxLength(100).IsRequired();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Incident).WithMany(x => x.Designations)
                .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Organization).WithMany(x => x.Designations)
                .HasForeignKey(x => x.OrgId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.OrgId, x.IncidentId }).IsUnique()
                .HasDatabaseName("ux_incident_designations_org_incident");
        });

        builder.Entity<IncidentRevision>(b =>
        {
            b.ToTable("incident_revisions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.IncidentId).HasColumnName("incident_id");
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.EditorId).HasColumnName("editor_id");
            b.Property(x => x.Reason).HasColumnName("reason");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Incident).WithMany(x => x.Revisions)
                .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.IncidentId, x.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("ix_incident_revisions_incident");
        });

        builder.Entity<RecordRevision>(b =>
        {
            b.ToTable("record_revisions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.EditorId).HasColumnName("editor_id");
            b.Property(x => x.Reason).HasColumnName("reason");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Record).WithMany(x => x.Revisions)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.RecordId, x.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("ix_record_revisions_record");
        });

        builder.Entity<RecordAssessment>(b =>
        {
            b.ToTable("record_assessments");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.UserId).HasColumnName("user_id");
            b.Property(x => x.Assessment).HasColumnName("assessment").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Record).WithMany(x => x.Assessments)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.RecordId, x.UserId }).IsUnique()
                .HasDatabaseName("ux_record_assessments_record_user");
        });

        builder.Entity<RecordAccessRequest>(b =>
        {
            b.ToTable("record_access_requests");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.RequesterId).HasColumnName("requester_id");
            b.Property(x => x.Status).HasColumnName("status").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.DecidedBy).HasColumnName("decided_by");
            b.Property(x => x.DecidedAt).HasColumnName("decided_at");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Record).WithMany(x => x.AccessRequests)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.RecordId, x.Status })
                .HasDatabaseName("ix_record_access_requests_record_status");
        });

        builder.Entity<Playlist>(b =>
        {
            b.ToTable("playlists");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.IncidentId).HasColumnName("incident_id");
            b.Property(x => x.AuthorId).HasColumnName("author_id");
            b.Property(x => x.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
            b.Property(x => x.Description).HasColumnName("description");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Incident).WithMany(x => x.Playlists)
                .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.IncidentId, x.CreatedAt, x.Id })
                .IsDescending(false, true, false)
                .HasDatabaseName("ix_playlists_incident");
        });

        builder.Entity<PlaylistItem>(b =>
        {
            b.ToTable("playlist_items");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.PlaylistId).HasColumnName("playlist_id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.Position).HasColumnName("position");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Playlist).WithMany(x => x.Items)
                .HasForeignKey(x => x.PlaylistId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Record).WithMany(x => x.PlaylistItems)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.PlaylistId, x.RecordId }).IsUnique()
                .HasDatabaseName("ux_playlist_items_playlist_record");
            b.HasIndex(x => new { x.PlaylistId, x.Position })
                .HasDatabaseName("ix_playlist_items_position");
        });

        builder.Entity<OrganizationModerator>(b =>
        {
            b.ToTable("organization_moderators");
            b.HasKey(x => new { x.OrgId, x.UserId });
            b.Property(x => x.OrgId).HasColumnName("org_id");
            b.Property(x => x.UserId).HasColumnName("user_id");
            b.Property(x => x.AppointedById).HasColumnName("appointed_by_id");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Organization).WithMany(x => x.Moderators)
                .HasForeignKey(x => x.OrgId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrganizationRevision>(b =>
        {
            b.ToTable("organization_revisions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.OrgId).HasColumnName("org_id");
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.EditorId).HasColumnName("editor_id");
            b.Property(x => x.Reason).HasColumnName("reason");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Organization).WithMany(x => x.Revisions)
                .HasForeignKey(x => x.OrgId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.OrgId, x.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("ix_organization_revisions_org");
        });

        builder.Entity<OrganizationVote>(b =>
        {
            b.ToTable("organization_votes");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.OrgId).HasColumnName("org_id");
            b.Property(x => x.UserId).HasColumnName("user_id");
            b.Property(x => x.Value).HasColumnName("value");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Organization).WithMany(x => x.Votes)
                .HasForeignKey(x => x.OrgId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.OrgId, x.UserId }).IsUnique()
                .HasDatabaseName("ux_organization_votes_org_user");
        });

        builder.Entity<OrgMention>(b =>
        {
            b.ToTable("org_mentions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.OrgId).HasColumnName("org_id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.IncidentId).HasColumnName("incident_id");
            b.Property(x => x.RawText).HasColumnName("raw_text").HasMaxLength(255).IsRequired();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Organization).WithMany(x => x.Mentions)
                .HasForeignKey(x => x.OrgId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(x => x.Record).WithMany(x => x.Mentions)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Incident).WithMany(x => x.Mentions)
                .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.OrgId, x.RecordId, x.IncidentId })
                .HasDatabaseName("ix_org_mentions_source");
        });

        builder.Entity<Recognition>(b =>
        {
            b.ToTable("recognitions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.RecognizingOrgId).HasColumnName("recognizing_org_id");
            b.Property(x => x.RecognizedOrgId).HasColumnName("recognized_org_id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.Approved).HasColumnName("approved");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.RecognizingOrganization).WithMany(x => x.RecognitionsGiven)
                .HasForeignKey(x => x.RecognizingOrgId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.RecognizedOrganization).WithMany(x => x.RecognitionsReceived)
                .HasForeignKey(x => x.RecognizedOrgId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Record).WithMany(x => x.Recognitions)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.RecognizingOrgId, x.RecognizedOrgId }).IsUnique()
                .HasDatabaseName("ux_recognitions_org_pair");
        });

        builder.Entity<CharacterImport>(b =>
        {
            b.ToTable("character_imports");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.DraftId).HasColumnName("draft_id");
            b.Property(x => x.CharacterId).HasColumnName("character_id");
            b.Property(x => x.ImportedById).HasColumnName("imported_by_id");
            b.Property(x => x.RestrictedAcknowledgedAt).HasColumnName("restricted_acknowledged_at");
            b.Property(x => x.OwnerNotifiedAt).HasColumnName("owner_notified_at");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Draft).WithMany(x => x.CharacterImports)
                .HasForeignKey(x => x.DraftId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.Character).WithMany(x => x.Imports)
                .HasForeignKey(x => x.CharacterId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.DraftId, x.CharacterId }).IsUnique()
                .HasDatabaseName("ux_character_imports_draft_character");
        });

        builder.Entity<Draft>(b =>
        {
            b.ToTable("drafts");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.AuthorId).HasColumnName("author_id");
            b.Property(x => x.RecordType).HasColumnName("record_type").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.IncidentId).HasColumnName("incident_id");
            b.Property(x => x.Markdown).HasColumnName("markdown").IsRequired();
            b.Property(x => x.AccessPolicy).HasColumnName("access_policy").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<AccessPolicy>());
            b.Property(x => x.WarningTier).HasColumnName("warning_tier").HasMaxLength(10)
                .HasConversion(ArchiveValueConverters.SnakeCase<WarningTier>());
            b.Property(x => x.WarningDisclosure).HasColumnName("warning_disclosure").HasMaxLength(20)
                .HasConversion(ArchiveValueConverters.SnakeCase<WarningDisclosure>());
            b.Property(x => x.WarningTags).HasColumnName("warning_tags").HasColumnType("text[]");
            b.Property(x => x.Status).HasColumnName("status").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Incident).WithMany(x => x.Drafts)
                .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.SetNull);
            b.HasIndex(x => new { x.AuthorId, x.Status, x.UpdatedAt, x.Id })
                .IsDescending(false, false, true, false)
                .HasDatabaseName("ix_drafts_author");
        });

        builder.Entity<TemporaryEntity>(b =>
        {
            b.ToTable("temporary_entities");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.DraftId).HasColumnName("draft_id");
            b.Property(x => x.TempCode).HasColumnName("temp_code").HasMaxLength(20).IsRequired();
            b.Property(x => x.EntityType).HasColumnName("entity_type").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            b.Property(x => x.Payload).HasColumnName("payload").HasColumnType("jsonb").IsRequired();
            b.Property(x => x.ImageObjectKey).HasColumnName("image_object_key");
            b.Property(x => x.PromotedEntityId).HasColumnName("promoted_entity_id");
            b.Property(x => x.PromotedAt).HasColumnName("promoted_at");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Draft).WithMany(x => x.TemporaryEntities)
                .HasForeignKey(x => x.DraftId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.DraftId, x.TempCode }).IsUnique()
                .HasDatabaseName("ux_temporary_entities_draft_code");
        });

        builder.Entity<EntityLink>(b =>
        {
            b.ToTable("entity_links");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.DraftId).HasColumnName("draft_id");
            b.Property(x => x.SourceRecordId).HasColumnName("source_record_id");
            b.Property(x => x.SourceIncidentId).HasColumnName("source_incident_id");
            b.Property(x => x.TargetType).HasColumnName("target_type").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.TargetId).HasColumnName("target_id");
            b.Property(x => x.RawLink).HasColumnName("raw_link").HasMaxLength(64).IsRequired();
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Draft).WithMany(x => x.EntityLinks)
                .HasForeignKey(x => x.DraftId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.SourceRecord).WithMany(x => x.EntityLinks)
                .HasForeignKey(x => x.SourceRecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(x => x.SourceIncident).WithMany(x => x.EntityLinks)
                .HasForeignKey(x => x.SourceIncidentId).OnDelete(DeleteBehavior.Cascade);
            b.ToTable(t => t.HasCheckConstraint(
                "ck_entity_links_source",
                "draft_id IS NOT NULL OR source_record_id IS NOT NULL OR source_incident_id IS NOT NULL"));
            b.HasIndex(x => new { x.TargetType, x.TargetId })
                .HasDatabaseName("ix_entity_links_target");
            b.HasIndex(x => x.DraftId).HasDatabaseName("ix_entity_links_draft");
        });

        builder.Entity<Tombstone>(b =>
        {
            b.ToTable("tombstones");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.Reason).HasColumnName("reason").IsRequired();
            b.Property(x => x.Category).HasColumnName("category").HasMaxLength(50).IsRequired();
            b.Property(x => x.Hash).HasColumnName("hash").HasMaxLength(64).IsRequired();
            b.Property(x => x.TombstonedBy).HasColumnName("tombstoned_by");
            b.Property(x => x.TombstonedAt).HasColumnName("tombstoned_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Record).WithMany(x => x.Tombstones)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => x.Hash).HasDatabaseName("ix_tombstones_hash");
        });

        builder.Entity<ModerationLog>(b =>
        {
            b.ToTable("moderation_log");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.Action).HasColumnName("action").HasMaxLength(50)
                .HasConversion<string>();
            b.Property(x => x.Category).HasColumnName("category").HasMaxLength(50).IsRequired();
            b.Property(x => x.AnonymizedAuthorId).HasColumnName("anonymized_author_id");
            b.Property(x => x.RecordId).HasColumnName("record_id");
            b.Property(x => x.Reason).HasColumnName("reason").IsRequired();
            b.Property(x => x.ModeratorId).HasColumnName("moderator_id");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Record).WithMany(x => x.ModerationLogs)
                .HasForeignKey(x => x.RecordId).OnDelete(DeleteBehavior.SetNull);
            b.HasIndex(x => new { x.AnonymizedAuthorId, x.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("ix_moderation_log_author");
        });

        builder.Entity<ModerationAppeal>(b =>
        {
            b.ToTable("moderation_appeals");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.ModerationLogId).HasColumnName("moderation_log_id");
            b.Property(x => x.AppellantId).HasColumnName("appellant_id");
            b.Property(x => x.Statement).HasColumnName("statement").IsRequired();
            b.Property(x => x.Status).HasColumnName("status").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.DecidedBy).HasColumnName("decided_by");
            b.Property(x => x.DecidedAt).HasColumnName("decided_at");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.ModerationLog).WithMany(x => x.Appeals)
                .HasForeignKey(x => x.ModerationLogId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.ModerationLogId, x.Status })
                .HasDatabaseName("ix_moderation_appeals_log_status");
        });

        builder.Entity<Email>(b =>
        {
            b.ToTable("emails");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.FromAddress).HasColumnName("from_address").HasMaxLength(255).IsRequired();
            b.Property(x => x.ToUserId).HasColumnName("to_user_id");
            b.Property(x => x.Subject).HasColumnName("subject").HasMaxLength(255).IsRequired();
            b.Property(x => x.Body).HasColumnName("body").IsRequired();
            b.Property(x => x.Attachments).HasColumnName("attachments").HasColumnType("jsonb");
            b.Property(x => x.Type).HasColumnName("type").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.FiledIntoFolderId).HasColumnName("filed_into_folder_id");
            b.Property(x => x.IsRead).HasColumnName("is_read");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.FiledIntoFolder).WithMany(x => x.Emails)
                .HasForeignKey(x => x.FiledIntoFolderId).OnDelete(DeleteBehavior.SetNull);
            b.HasIndex(x => new { x.ToUserId, x.IsRead, x.CreatedAt, x.Id })
                .IsDescending(false, false, true, false)
                .HasDatabaseName("ix_emails_inbox");
        });

        builder.Entity<Folder>(b =>
        {
            b.ToTable("folders");
            b.HasKey(x => x.Id);
            b.Property(x => x.Id).HasColumnName("id");
            b.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            b.Property(x => x.ParentId).HasColumnName("parent_id");
            b.Property(x => x.OwnerId).HasColumnName("owner_id");
            b.Property(x => x.Type).HasColumnName("type").HasMaxLength(20)
                .HasConversion<string>();
            b.Property(x => x.RefId).HasColumnName("ref_id");
            b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
            b.HasOne(x => x.Parent).WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => new { x.OwnerId, x.ParentId, x.Name })
                .HasDatabaseName("ix_folders_owner_parent");
        });
    }

}
