#!/bin/bash
# Este script cambia al directorio del proyecto según el hostname

if [ "$(hostname)" = "DESKTOP-O3U7NPU" ]; then
  cd /mnt/c/Users/risk/Desktop/TFG/TFG/mi-app
else
  cd /mnt/c/Users/alvar/Desktop/Proyecto/TFG/mi-app
fi
yarn start
