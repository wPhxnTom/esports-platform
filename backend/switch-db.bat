@echo off
REM Switch Prisma datasource between SQLite (local) and PostgreSQL (production)
REM Usage: switch-db sqlite|postgres

if /i "%1"=="sqlite" (
  copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma
  echo Switched to SQLite (local dev)
) else if /i "%1"=="postgres" (
  copy /Y prisma\schema.postgres.prisma prisma\schema.prisma
  echo Switched to PostgreSQL (production deploy)
) else (
  echo Usage: switch-db sqlite^|postgres
)
