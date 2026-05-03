// Hearty Community Events v1

(function () {

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem('heartySettings') || '{}');
    } catch {
      return {};
    }
  }

  function getPosts() {
    try {
      return JSON.parse(localStorage.getItem('heartyCommunityPosts') || '[]');
    } catch {
      return [];
    }
  }

  function setPosts(posts) {
    localStorage.setItem('heartyCommunityPosts', JSON.stringify(posts));
  }

  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2) + Date.now();
  }

  function now() {
    return Date.now();
  }

  function getCurrentUserId() {
    return localStorage.getItem('heartyUserId') || 'user';
  }

  window.heartyLogCommunityEvent = function (type, data = {}) {
    const settings = getSettings();

    // Community OFF → do nothing
    if (!settings.communityEnabled) return;

    const posts = getPosts();

    posts.unshift({
      id: uid('event'),
      userId: getCurrentUserId(),
      postType: 'system_event',
      eventType: type,
      data,
      createdAt: now()
    });

    setPosts(posts);
  };

})();
