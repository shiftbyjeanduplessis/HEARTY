// hearty-lessons.v1.js
// Drop into /js/hearty-lessons.v1.js

window.HEARTY_LESSONS = [
  {
    "day": 1,
    "title": "What’s Actually Happening in Your Body",
    "body": "You’re not just eating less.\n\nGLP-1 changes how your body regulates hunger, slows stomach emptying, and reduces food noise. That’s why you suddenly feel full quickly — and why some days you barely feel like eating at all.\n\nThis is powerful, but it comes with a trade-off.\n\nIf you simply eat less without structure, your body doesn’t just lose fat — it can also lose muscle.\n\nThat’s why Hearty exists.\n\nYour job is not to eat perfectly. Your job is to guide your body through this phase correctly.\n\nFocus today:\n• Eat something, even if it’s small\n• Move a little\n• Stay consistent\n\nYou don’t need to be perfect. You just need to keep showing up."
  },
  {
    "day": 2,
    "title": "Why Protein Matters More Than Ever",
    "body": "When appetite drops, protein is usually the first thing to go.\n\nThat’s a problem.\n\nProtein is what tells your body: keep this muscle.\n\nWithout enough protein, your body becomes efficient — and starts breaking down muscle along with fat.\n\nThat can lead to:\n• Slower metabolism\n• Softer body composition\n• Weight regain later\n\nYou don’t need huge meals.\n\nYou need small, consistent protein intake:\n• Yoghurt\n• Eggs\n• Chicken\n• Tuna\n• Protein shakes when needed\n\nEven on low appetite days: something is better than nothing.\n\nThis is one of the most important habits you’ll build."
  },
  {
    "day": 3,
    "title": "Fat Loss vs Muscle Loss",
    "body": "The scale going down is not the full story.\n\nTwo people can lose the same weight:\n• One loses mostly fat and looks leaner and stronger\n• One loses muscle and looks smaller, but softer\n\nThe difference comes from:\n• Protein\n• Movement\n• Resistance training when ready\n\nYou are not trying to become lighter. You are trying to become healthier and stronger while losing fat.\n\nThat’s why Hearty keeps nudging you:\n• Eat protein\n• Move regularly\n• Don’t disappear from your routine on hard days\n\nNot aggressively. Just consistently."
  },
  {
    "day": 4,
    "title": "Why We Don’t Focus on Cardio",
    "body": "Most people think weight loss means more cardio.\n\nNot here.\n\nCardio burns calories, but GLP-1 already reduces intake massively. What you actually need is to preserve your body.\n\nThat comes from:\n• Walking\n• Strength work when ready\n• Recovery\n\nToo much cardio too soon can increase fatigue, reduce recovery, and make consistency harder.\n\nSo we start simple: a 15-minute walk.\n\nThat is enough to begin.\n\nThe goal is not to punish your body into weight loss. The goal is to protect it while the medication helps reduce appetite."
  },
  {
    "day": 5,
    "title": "Bad Days Are Part of This",
    "body": "Some days will feel terrible.\n\nYou may feel:\n• Nauseous\n• Tired\n• Off\n• Unmotivated\n\nThat is not failure. That is part of the process.\n\nMost people quit here because they think a bad day means the plan is broken.\n\nHearty does something different: it adjusts with you.\n\nOn bad days:\n• Eat what you can\n• Move less\n• Keep the habit alive\n• Avoid turning one bad day into a full stop\n\nConsistency beats intensity.\n\nIf you stay in the game, you win."
  },
  {
    "day": 6,
    "title": "Low Appetite Days: What Actually Matters",
    "body": "Some days you’ll barely eat.\n\nThat can happen — but don’t let it become the pattern.\n\nOn low appetite days, focus on:\n• Fluids\n• Protein first\n• Simple foods\n• Small portions\n\nUseful options:\n• Yoghurt\n• Soup\n• A protein shake\n• Fruit with a protein option\n• Eggs or tuna if you can manage it\n\nForget perfect meals on these days.\n\nThink: what is the minimum I can do today to support my body?\n\nThat mindset changes everything."
  },
  {
    "day": 7,
    "title": "Why We Track Without Obsessing",
    "body": "Tracking is not about control.\n\nIt is about awareness.\n\nWeight, photos, water, movement, and small actions show you trends over time.\n\nBut daily fluctuations mean very little.\n\nA single weigh-in can be affected by:\n• Water retention\n• Digestion\n• Salt\n• Stress\n• Sleep\n\nYou are not trying to win today.\n\nYou are trying to build patterns that win over time.\n\nHearty keeps things simple:\n• Log when you can\n• Don’t panic when you can’t\n• Look for trends, not noise"
  },
  {
    "day": 8,
    "title": "Movement Builds Momentum",
    "body": "Movement is not punishment.\n\nIt is a signal.\n\nWhen you move, your body hears: we need to stay functional.\n\nThat helps protect strength, confidence, and mobility while weight changes.\n\nYou don’t need to become a gym person overnight.\n\nYou need:\n• Walking\n• Small actions\n• Repeatable habits\n• Strength when ready\n\nMomentum comes from doing small things repeatedly.\n\nThe first walk matters because it teaches your brain: I am the kind of person who keeps going."
  },
  {
    "day": 9,
    "title": "This Is Not a Diet Phase",
    "body": "This is where most people get it wrong.\n\nThey treat GLP-1 like a temporary diet.\n\nThen when appetite returns or life gets messy, the structure disappears.\n\nInstead, use this time to build habits that can survive later:\n• Simple meals\n• Protein awareness\n• Regular movement\n• Weekly check-ins\n• Support mode on hard days\n\nGLP-1 gives you a window.\n\nUse it to build something sustainable.\n\nThe medication helps reduce the noise. Your habits decide what happens next."
  },
  {
    "day": 10,
    "title": "What Success Actually Looks Like",
    "body": "Success is not perfect days.\n\nSuccess is not extreme discipline.\n\nSuccess is not losing weight as fast as possible.\n\nSuccess is:\n• Showing up on hard days\n• Doing the minimum when needed\n• Eating protein when appetite is low\n• Walking even when it is only 15 minutes\n• Returning after interruptions\n\nIf you’ve made it here, you’ve already done the hard part: you started.\n\nNow it’s about continuing.\n\nNo pressure. No perfection. Just steady progress."
  }
];

window.HeartyLessonState = (function(){
  const INDEX_KEY = 'heartyLessonIndex';
  const COMPLETED_DATE_KEY = 'heartyLessonCompletedDate';
  const FINISHED_KEY = 'heartyLessonsFinished';

  function todayKey(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function getIndex(){
    const raw = parseInt(localStorage.getItem(INDEX_KEY) || '0', 10);
    return Number.isFinite(raw) ? Math.max(0, Math.min(raw, window.HEARTY_LESSONS.length)) : 0;
  }

  function isFinished(){
    return localStorage.getItem(FINISHED_KEY) === 'true' || getIndex() >= window.HEARTY_LESSONS.length;
  }

  function getCurrentLesson(){
    if(isFinished()) return null;
    return window.HEARTY_LESSONS[getIndex()] || null;
  }

  function completedToday(){
    return localStorage.getItem(COMPLETED_DATE_KEY) === todayKey();
  }

  function markComplete(){
    if(isFinished()) return { finished:true };
    if(completedToday()) return { completedToday:true, lesson:getCurrentLesson() };
    const nextIndex = getIndex() + 1;
    localStorage.setItem(COMPLETED_DATE_KEY, todayKey());
    localStorage.setItem(INDEX_KEY, String(nextIndex));
    if(nextIndex >= window.HEARTY_LESSONS.length){
      localStorage.setItem(FINISHED_KEY, 'true');
      return { finished:true };
    }
    return { completed:true, nextUnlock:'tomorrow' };
  }

  return { todayKey, getIndex, isFinished, getCurrentLesson, completedToday, markComplete };
})();
