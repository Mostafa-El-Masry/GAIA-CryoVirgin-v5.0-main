@echo off
REM GAIA CryoVirgin · Call Center Python Engine
REM Adjust paths below to match your folder structure.

SETLOCAL ENABLEDELAYEDEXPANSION

set BASE=%~dp0

set SUMMARY_CSV=%BASE%input\summary.csv
set DETAILS_CSV=%BASE%input\details.csv
set TEMPLATE_SUMMARY=%BASE%public\templates\CallCenterReportTemplate.xlsx

set /p MONTH_LABEL=Enter month label (e.g. Nov'2025): 

set OUTPUT=%BASE%output
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

set OUT_SUMMARY=%OUTPUT%\Call Center Report-%MONTH_LABEL%.xlsx
set OUT_DETAILS=%OUTPUT%\Call Center Report-Details-%MONTH_LABEL%.xlsx

echo Running Python script...
python "%BASE%scripts\call_center_report.py" "%SUMMARY_CSV%" "%DETAILS_CSV%" "%TEMPLATE_SUMMARY%" "%OUT_SUMMARY%" "%OUT_DETAILS%"

echo.
echo Finished. Check the "output" folder.
pause
