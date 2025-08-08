@echo off
echo Clearing React cache files...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "build" rmdir /s /q "build"
echo Cache cleared successfully!
echo Starting development server...
npm start 