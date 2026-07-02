; The Last Guildmaster — Inno Setup Script
; Generates a custom Windows Installer with Install, Repair, and Uninstall capabilities.

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
// Pascal Script for detecting existing installations and offering Repair/Reinstall
function InitializeSetup(): Boolean;
var
  UninstallKey: string;
  OldVersion: string;
begin
  Result := True;
  UninstallKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\com.lemoinine.lastguildmaster_is1';
  
  // Check if the registry key exists under Current User (since it is a non-admin installation)
  if RegValueExists(HKCU, UninstallKey, 'UninstallString') then
  begin
    if RegQueryStringValue(HKCU, UninstallKey, 'DisplayVersion', OldVersion) then
    begin
      if MsgBox('The Last Guildmaster version ' + OldVersion + ' is already installed.' + #13#10 + #13#10 +
                'Would you like to Repair/Reinstall the current files?', mbConfirmation, MB_YESNO) = IDYES then
      begin
        // Let the installer proceed to overwrite the files (Repair/Reinstall mode)
        Result := True;
      end
      else
      begin
        // Abort the setup execution
        Result := False;
      end;
    end;
  end;
end;
