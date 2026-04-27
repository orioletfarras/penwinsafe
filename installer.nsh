; PenwinSafe custom NSIS installer script
; Checks for WireGuard and installs it if missing

!macro customInstall
  ; Check if WireGuard is installed
  IfFileExists "$PROGRAMFILES64\WireGuard\wireguard.exe" wg_exists wg_missing

  wg_missing:
    DetailPrint "Instalando WireGuard..."
    ; Download WireGuard installer
    inetc::get /CAPTION "PenwinSafe" /BANNER "Descargando WireGuard VPN..." \
      "https://download.wireguard.com/windows-client/wireguard-installer.exe" \
      "$TEMP\wireguard-installer.exe" /END
    Pop $0
    StrCmp $0 "OK" wg_download_ok wg_download_fail

    wg_download_ok:
      ExecWait '"$TEMP\wireguard-installer.exe" /S'
      Delete "$TEMP\wireguard-installer.exe"
      Goto wg_exists

    wg_download_fail:
      MessageBox MB_OK|MB_ICONEXCLAMATION \
        "No se pudo descargar WireGuard.$\nPenwinSafe funcionará sin túnel VPN.$\nPuedes instalarlo manualmente desde wireguard.com"

  wg_exists:
    ; Create ProgramData\WireGuard directory for config files
    CreateDirectory "$APPDATA\..\Local\ProgramData\WireGuard"

    ; Set WireGuard service to start automatically
    ExecWait 'sc config WireGuardTunnel$$penwinsafe start= auto' $0
!macroend

!macro customUnInstall
  ; Remove WireGuard tunnel service if active
  ExecWait '"$PROGRAMFILES64\WireGuard\wireguard.exe" /uninstalltunnelservice penwinsafe'
!macroend
