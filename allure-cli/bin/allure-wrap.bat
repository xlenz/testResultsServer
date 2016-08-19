set inputPath=%1
set outputPath=%2
rem set inputPath=allure-results
rem set outputPath=allure-report

allure generate %inputPath% -o %outputPath%
