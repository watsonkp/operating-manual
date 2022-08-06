#!/bin/bash

# Referencing https://www.postgresql.org/docs/13/backup-dump.html

# Set PGPASSWORD environment variable in psql-env.list file so that pg_dump does not ask for the password on STDIN.
# File backup will work, but is tightly bound to version and architecture.
# tar czvf backup.tar.gz data

# Backup with PostgreSQL custom compression similar to gzip.
# Restore with pg_restore -d dbname filename
#docker run -it --rm --network platform-network --env-file psql-env.list postgres:13 pg_dump -Fc -h manual-db -U postgres operating_manual > db-dump.pgdump

# Backup to plaintext that can be rebuilt with psql. Version and architecture agnostic.
# Can optionally compress with gzip
# pg_dump dbname | gzip > filename.gz
# gunzip -c filename.gz | psql dbname
docker run -it --rm --network platform-network --env-file psql-env.list postgres:13 pg_dump -h manual-db -U postgres operating_manual > db-dump.txt
