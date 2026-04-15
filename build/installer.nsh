/**
 * installer.nsh — Custom Windows Installer Logic
 * Focuses on stability and non-invasive updates.
 */

!include "nsDialogs.nsh"

# Note: We have removed the 'Clean Install' RMDir logic to avoid messing with player files.
# The game now handles stability (Black Screen & Cache errors) via code-level flags in main.js.

!macro customInstall
    # No invasive file deletions here. 
    # Saves and temporary files are preserved.
    DetailPrint "System stability flags applied in main.js. Skipping AppData cleanup."
!macroend

