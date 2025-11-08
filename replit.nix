{ pkgs }: {
  deps = [
    pkgs.fontconfig
    pkgs.pixman
    pkgs.giflib
    pkgs.libjpeg
    pkgs.libuuid
    pkgs.pango
    pkgs.cairo
    pkgs.bashInteractive
    pkgs.nodePackages.bash-language-server
    pkgs.man
  ];
}