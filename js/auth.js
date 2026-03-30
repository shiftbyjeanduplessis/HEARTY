
function showNotice(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `notice show ${type}`;
}
function clearNotice(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.className = 'notice';
}
function setLoading(button, isLoading, loadingText) {
  if (!button) return;
  if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.originalText;
}
async function redirectAfterLogin() {
  const session = await window.HEARTY.getSession();
  if (!session) return;
  let settings = await window.HEARTY.getSettings(session.user.id);
  if (!settings) settings = await window.HEARTY.ensureUserSettings(session.user.id);
  window.location.href = settings && settings.onboarding_complete ? 'app.html' : 'onboarding.html';
}
