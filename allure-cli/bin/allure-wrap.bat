set inputPath=%1
set outputPath=%2
set allureVersion=%3
rem set inputPath=allure-results_1435288828499
rem set outputPath=site
rem set allureVersion=1.4.14

allure generate %inputPath% -o %outputPath% -v %allureVersion%
