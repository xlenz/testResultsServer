set inputPath=%1
set outputPath=%2
rem set inputPath=allure-results
rem set outputPath=site

allure generate %inputPath% -o %outputPath%
