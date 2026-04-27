HEARTY PWA INSTALL PACKAGE

Upload these files/folders to the public root of your site:
- manifest.json
- service-worker.js
- pwa-install.js
- pwa-install.css
- hearty-logo.png
- /icons/icon-192.png
- /icons/icon-512.png
- /icons/maskable-512.png
- /icons/apple-touch-icon.png

Add pwa-head-snippet.html inside <head> on index.html and main pages.
Add pwa-body-snippet.html before </body> on the same pages.

Browsers do not allow forced install. This setup makes Hearty installable, fullscreen/standalone after install, and shows an install banner as aggressively as browsers allow.
