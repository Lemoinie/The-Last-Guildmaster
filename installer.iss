; The Last Guildmaster — Custom Game-Themed Windows Installer
; Enforces Install, Update, Repair, and Uninstall capabilities.

[Setup]
AppId={{com.lemoinine.lastguildmaster}}
AppName=The Last Guildmaster
AppVersion=0.1.0
AppPublisher=Lemoinine
AppPublisherURL=https://github.com/Lemoinie/The-Last-Guildmaster
AppSupportURL=https://github.com/Lemoinie/The-Last-Guildmaster
AppUpdatesURL=https://github.com/Lemoinie/The-Last-Guildmaster
DefaultDirName={localappdata}\Programs\the-last-guildmaster
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=The-Last-Guildmaster-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
DefaultGroupName=The Last Guildmaster
UninstallDisplayIcon={app}\The Last Guildmaster.exe
UninstallDisplayName=The Last Guildmaster

; Game-themed installer artwork
WizardImageFile=assets\installer-welcome.png
WizardSmallImageFile=assets\installer-logo.png

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\The Last Guildmaster"; Filename: "{app}\The Last Guildmaster.exe"
Name: "{userdesktop}\The Last Guildmaster"; Filename: "{app}\The Last Guildmaster.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\The Last Guildmaster.exe"; Description: "{cm:LaunchProgram,The Last Guildmaster}"; Flags: nowait postinstall skipifsilent

[Code]
// Helper function to split version string into major, minor, patch
procedure ParseVersion(VersionStr: string; var Major, Minor, Patch: Integer);
var
  P: Integer;
  Part: string;
begin
  Major := 0;
  Minor := 0;
  Patch := 0;
  
  P := Pos('.', VersionStr);
  if P > 0 then
  begin
    Part := Copy(VersionStr, 1, P - 1);
    Major := StrToIntDef(Part, 0);
    VersionStr := Copy(VersionStr, P + 1, Length(VersionStr));
    P := Pos('.', VersionStr);
    if P > 0 then
    begin
      Part := Copy(VersionStr, 1, P - 1);
      Minor := StrToIntDef(Part, 0);
      Part := Copy(VersionStr, P + 1, Length(VersionStr));
      Patch := StrToIntDef(Part, 0);
    end
    else
    begin
      Minor := StrToIntDef(VersionStr, 0);
    end;
  end
  else
  begin
    Major := StrToIntDef(VersionStr, 0);
  end;
end;

// Compares two semantic version strings: returns 1 if V1 > V2, -1 if V1 < V2, 0 if equal
function CompareVersions(V1, V2: string): Integer;
var
  Major1, Minor1, Patch1: Integer;
  Major2, Minor2, Patch2: Integer;
begin
  ParseVersion(V1, Major1, Minor1, Patch1);
  ParseVersion(V2, Major2, Minor2, Patch2);
  
  if Major1 > Major2 then Result := 1
  else if Major1 < Major2 then Result := -1
  else if Minor1 > Minor2 then Result := 1
  else if Minor1 < Minor2 then Result := -1
  else if Patch1 > Patch2 then Result := 1
  else if Patch1 < Patch2 then Result := -1
  else Result := 0;
end;

// Setup initialization: handles Update, Repair, Reinstall, and Downgrade prompts
function InitializeSetup(): Boolean;
var
  UninstallKey: string;
  OldVersion: string;
  CompareResult: Integer;
  InstallerVersion: string;
begin
  Result := True;
  UninstallKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\com.lemoinine.lastguildmaster_is1';
  InstallerVersion := '0.1.0'; // Must match AppVersion in [Setup]
  
  if RegValueExists(HKCU, UninstallKey, 'UninstallString') then
  begin
    if RegQueryStringValue(HKCU, UninstallKey, 'DisplayVersion', OldVersion) then
    begin
      CompareResult := CompareVersions(InstallerVersion, OldVersion);
      
      if CompareResult > 0 then
      begin
        // Installer version is NEWER (Update mode)
        if MsgBox('An older version (' + OldVersion + ') of The Last Guildmaster is currently installed.' + #13#10 + #13#10 +
                  'Would you like to update it to version ' + InstallerVersion + '?', mbConfirmation, MB_YESNO) = IDYES then
        begin
          Result := True;
        end
        else
        begin
          Result := False;
        end;
      end
      else if CompareResult = 0 then
      begin
        // Same version is installed (Repair / Reinstall mode)
        if MsgBox('The Last Guildmaster version ' + InstallerVersion + ' is already installed.' + #13#10 + #13#10 +
                  'Would you like to Repair or Reinstall the application files?', mbConfirmation, MB_YESNO) = IDYES then
        begin
          Result := True;
        end
        else
        begin
          Result := False;
        end;
      end
      else
      begin
        // Installer version is OLDER (Downgrade mode)
        if MsgBox('A newer version (' + OldVersion + ') of The Last Guildmaster is already installed.' + #13#10 + #13#10 +
                  'Installing this version will downgrade the application to version ' + InstallerVersion + '.' + #13#10 + #13#10 +
                  'Do you wish to continue?', mbConfirmation, MB_YESNO) = IDYES then
        begin
          Result := True;
        end
        else
        begin
          Result := False;
        end;
      end;
    end;
  end;
end;

// Inno Setup controls styling to match the game's dark obsidian glass theme
procedure InitializeWizard();
var
  BgColor: TColor;
  HeaderBgColor: TColor;
  TextPrimaryColor: TColor;
  TextSecondaryColor: TColor;
begin
  // Game theme variables
  BgColor := $0A0705;          // --bg-dark (#05070a, BGR is $0A0705)
  HeaderBgColor := $17110D;    // --panel-bg (#0d1117, BGR is $17110D)
  TextPrimaryColor := $FCFAF8; // --text-primary (#f8fafc, BGR is $FCFAF8)
  TextSecondaryColor := $B8A394; // --text-secondary (#94a3b8, BGR is $B8A394)

  // Color main windows
  WizardForm.Color := BgColor;
  WizardForm.WelcomePage.Color := BgColor;
  WizardForm.InnerPage.Color := BgColor;
  WizardForm.FinishedPage.Color := BgColor;

  // Header panel of inner pages
  WizardForm.MainPanel.Color := HeaderBgColor;
  
  // Apply text colors to main labels
  WizardForm.WelcomeLabel1.Font.Color := TextPrimaryColor;
  WizardForm.WelcomeLabel2.Font.Color := TextSecondaryColor;
  
  WizardForm.PageNameLabel.Font.Color := TextPrimaryColor;
  WizardForm.PageDescriptionLabel.Font.Color := TextSecondaryColor;
  
  WizardForm.ReadyLabel.Font.Color := TextPrimaryColor;
  WizardForm.ReadyMemo.Color := BgColor;
  WizardForm.ReadyMemo.Font.Color := TextSecondaryColor;
  
  WizardForm.SelectDirLabel.Font.Color := TextPrimaryColor;
  WizardForm.DirEdit.Color := BgColor;
  WizardForm.DirEdit.Font.Color := TextPrimaryColor;
  
  WizardForm.FinishedHeadingLabel.Font.Color := TextPrimaryColor;
  WizardForm.FinishedLabel.Font.Color := TextSecondaryColor;
  
  // Custom button styling hooks where possible
  WizardForm.NextButton.Font.Color := TextPrimaryColor;
  WizardForm.BackButton.Font.Color := TextPrimaryColor;
  WizardForm.CancelButton.Font.Color := TextPrimaryColor;
end;
