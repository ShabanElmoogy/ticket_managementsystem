@echo off
cd /d "%~dp0"
echo Running Prisma migration...
npx prisma migrate dev --name fix_refresh_token_column_type
pause
