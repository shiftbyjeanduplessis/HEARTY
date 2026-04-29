(function () {
  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isHomePage() {
    const path = window.location.pathname.toLowerCase();
    return path.endsWith("/home.html") || path.endsWith("/app.html");
  }

  function showInstallBanner() {
    if (!isHomePage()) return;
    if (isStandalone()) return;
    if (document.getElementById("heartyInstallBanner")) return;

    const banner = document.createElement("div");
    banner.id = "heartyInstallBanner";
    banner.innerHTML = `
      <div class="hearty-install-card">
        <strong>Install Hearty</strong>
        <span>Add it to your home screen for the full app feel.</span>
        <button id="heartyInstallBtn" type="button">Install</button>
        <button id="heartyInstallClose" type="button" aria-label="Close">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById("heartyInstallClose").onclick = () => banner.remove();

    document.getElementById("heartyInstallBtn").onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => {});
        deferredPrompt = null;
        banner.remove();
      } else {
        alert("On iPhone: tap Share, then Add to Home Screen.\nOn Android: use the browser menu and tap Install app.");
      }
    };
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    window.addEventListener("hearty-home-ready", () => {
      setTimeout(showInstallBanner, 1200);
    }, { once: true });
  });

  window.addEventListener("appinstalled", () => {
    const banner = document.getElementById("heartyInstallBanner");
    if (banner) banner.remove();
    deferredPrompt = null;
  });

  window.addEventListener("load", () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }

    if (isHomePage()) {
      window.addEventListener("hearty-home-ready", () => {
        setTimeout(showInstallBanner, 1200);
      }, { once: true });
    }
  });
})();
