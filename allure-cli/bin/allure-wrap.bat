rem set inputPath=%1
rem set outputPath=%2
set inputPath=allure-results
set outputPath=allure-report

allure generate %inputPath% -o %outputPath%
