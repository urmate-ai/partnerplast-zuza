@echo off
REM Skrypt do konfiguracji Java 17 dla lokalnego builda Android

echo ========================================
echo Konfiguracja Java 17 dla Android Build
echo ========================================
echo.

REM Sprawdź czy Java 17 jest już zainstalowana
where java >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    java -version 2>&1 | findstr /C:"version \"17" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Java 17 jest już zainstalowana!
        goto :set_java_home
    )
)

echo [INFO] Java 17 nie jest zainstalowana lub nie jest ustawiona jako domyślna.
echo.
echo Opcje:
echo 1. Pobierz Java 17 z: https://adoptium.net/temurin/releases/?version=17
echo 2. Zainstaluj do np. C:\Program Files\Java\jdk-17
echo 3. Uruchom ponownie ten skrypt
echo.
echo Lub użyj EAS Build lokalnie (nie wymaga Java):
echo   eas build --platform android --profile preview --local
echo.
pause
exit /b 1

:set_java_home
echo.
echo Ustawianie JAVA_HOME dla tej sesji...
echo.

REM Sprawdź typowe lokalizacje Java 17
set JAVA17_PATHS[0]=C:\Program Files\Java\jdk-17
set JAVA17_PATHS[1]=C:\Program Files\Eclipse Adoptium\jdk-17.0.0+8-hotspot
set JAVA17_PATHS[2]=C:\Program Files (x86)\Java\jdk-17
set JAVA17_PATHS[3]=%USERPROFILE%\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.0+8-hotspot

for /L %%i in (0,1,3) do (
    call set "PATH_CHECK=%%JAVA17_PATHS[%%i]%%"
    if exist "!PATH_CHECK!\bin\java.exe" (
        set JAVA_HOME=!PATH_CHECK!
        echo [OK] Znaleziono Java 17 w: !JAVA_HOME!
        goto :found
    )
)

echo [ERROR] Nie znaleziono Java 17 w typowych lokalizacjach.
echo.
echo Ustaw JAVA_HOME ręcznie:
echo   set JAVA_HOME=C:\sciezka\do\jdk-17
echo.
echo Następnie uruchom:
echo   cd android
echo   gradlew assembleRelease
echo.
pause
exit /b 1

:found
echo.
echo JAVA_HOME ustawione na: %JAVA_HOME%
echo.
echo Teraz możesz zbudować APK:
echo   cd android
echo   gradlew assembleRelease
echo.
pause
