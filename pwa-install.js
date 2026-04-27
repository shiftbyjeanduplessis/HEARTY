(function(){
  let deferredPrompt = null;

  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function showInstallBanner(){
    if (isStandalone() || document.getElementById('heartyInstallBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'heartyInstallBanner';
    banner.innerHTML = '<div class="hearty-install-copy"><strong>Install Hearty</strong><span>Add it to your home screen for the full app experience.</span></div><button type="button" id="heartyInstallBtn">Install</button><button type="button" id="heartyInstallClose" aria-label="Dismiss">×</button>';
    document.body.appendChild(banner);

    document.getElementById('heartyInstallClose').onclick = () => banner.remove();
    document.getElementById('heartyInstallBtn').onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => {});
        deferredPrompt = null;
        banner.remove();
      } else {
        alert('On iPhone: tap Share, then Add to Home Screen. On Android: use the browser menu and tap Install app.');
      }
    };
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    setTimeout(showInstallBanner, 1200);
  });

  window.addEventListener('appinstalled', () => {
    const banner = document.getElementById('heartyInstallBanner');
    if (banner) banner.remove();
    deferredPrompt = null;
  });

  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    }
    setTimeout(showInstallBanner, 1800);
  });
})();
