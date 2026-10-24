@echo off
rem Lokales Testnetz: Velocity (25577) + Hub (25567) + SMP (25568). Stoppen: in jedem Fenster "stop" (Proxy: "end").
set JAVA="C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot\bin\java.exe"
start "Testnetz Hub" /d "%~dp0hub" %JAVA% -Xms1G -Xmx2G -jar paper-26.3-207.jar nogui
start "Testnetz SMP" /d "%~dp0smp" %JAVA% -Xms1G -Xmx2G -jar paper-26.3-207.jar nogui
start "Testnetz Proxy" /d "%~dp0proxy" %JAVA% -Xms256M -Xmx512M -jar velocity-4.3.0-44.jar
