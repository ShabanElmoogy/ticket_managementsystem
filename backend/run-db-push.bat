@echo off
cd /d "%~dp0"
echo Running Prisma db push...
npx prisma db push
echo.
echo Migration complete!
pause
