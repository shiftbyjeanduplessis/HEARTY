// Hearty Community Events v1

(function () {
  const SETTINGS_KEY = 'heartySettings';
  const POSTS_KEY = 'heartyCommunityPosts';
  const USER_KEY = 'heartyUserId';

  function safeParse(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function getSettings() {
    return safeParse(SETTINGS_KEY, {});
  }

  function getPosts() {
    return safeParse(POSTS_KEY, []);
  }

  function setPosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    window.dispatchEvent(new CustomEvent('hearty:community-updated', { detail: posts }));
  }

  function uid(prefix = 'event') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getCurrentUserId() {
    return localStorage.getItem(USER_KEY) || 'local_user';
  }

  function isCommunityEnabled() {
    return getSettings().communityEnabled === true;
  }

  window.heartyCommunityIsEnabled = isCommunityEnabled;

  window.heartyLogCommunityEvent = function (type, data = {}) {
    if (!isCommunityEnabled()) return false;

    const safeTypes = new Set([
      'workout_complete',
      'weigh_in_logged',
      'meal_plan_generated',
      'support_mode_on',
      'lesson_complete'
    ]);

    if (!safeTypes.has(type)) return false;

    const posts = getPosts();

    posts.unshift({
      id: uid('event'),
      userId: getCurrentUserId(),
      postType: 'system_event',
      eventType: type,
      data: {},
      createdAt: Date.now()
    });

    setPosts(posts.slice(0, 100));
    return true;
  };
})();
