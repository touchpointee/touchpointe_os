using System;
using Npgsql;

var connectionString = "Host=localhost;Database=touchpointe_ms;Username=postgres;Password=123456qw";

Console.WriteLine("Connecting to database...");
using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
Console.WriteLine("Connected.");

var sql = @"
DO $$
BEGIN
    -- 1. Tags: Missing CreatedById
    BEGIN
        ALTER TABLE ""Tags"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error updating Tags CreatedById: %', SQLERRM; END;

    -- 2. Messages: Missing CreatedById, LastModifiedAt, LastModifiedById
    BEGIN
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""Messages"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error updating Messages audit fields: %', SQLERRM; END;

    -- 3. TaskComments: Missing CreatedById, LastModifiedAt, LastModifiedById
    BEGIN
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""CreatedById"" uuid NULL;
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""LastModifiedAt"" timestamp with time zone NULL;
        ALTER TABLE ""TaskComments"" ADD COLUMN IF NOT EXISTS ""LastModifiedById"" uuid NULL;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Error updating TaskComments audit fields: %', SQLERRM; END;

END $$;
";

Console.WriteLine("Executing final schema updates...");
using var cmd = new NpgsqlCommand(sql, conn);
await cmd.ExecuteNonQueryAsync();
Console.WriteLine("Database schema update executed successfully.");
