/* ============================================================
 * Listen Again · 背景音乐（全站共享）
 * - 进入页面尝试自动播放；被浏览器 autoplay 拦截时，用户第一次
 *   点击/按键后立即开始（无提示弹窗）
 * - 循环播放，默认音量 12%
 * - 声音实验页播放实验音频（含助听器弹窗音频）时自动暂停，
 *   实验音频暂停/结束后自动恢复
 * - 播放进度存 localStorage，页面切换后从上次位置继续
 * - 右上角小型开关可手动静音/恢复，状态同样记忆
 * ============================================================ */
(function () {
  'use strict';

  /* 音乐路径跟随本脚本位置（assets/bgm.js → assets/audio/...） */
  var base = document.currentScript.src.replace(/bgm\.js.*$/, '');
  var SRC = base + 'audio/background-music.m4a';

  var LS_TIME = 'listen-again-bgm-time';
  var LS_MUTE = 'listen-again-bgm-muted';

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.volume = 0.18;          /* 背景音量，不盖过实验音频 */
  audio.preload = 'auto';

  var muted = false;
  try { muted = localStorage.getItem(LS_MUTE) === '1'; } catch (e) {}

  /* ---- 跨页续播：恢复上次播放位置，每秒存一次 ---- */
  try {
    var t = parseFloat(localStorage.getItem(LS_TIME));
    if (isFinite(t) && t > 0) audio.currentTime = t;
  } catch (e) {}

  function saveTime() {
    try { localStorage.setItem(LS_TIME, String(audio.currentTime || 0)); } catch (e) {}
  }
  setInterval(saveTime, 1000);
  window.addEventListener('pagehide', saveTime);

  /* ---- 播放控制 ---- */
  function startIfAllowed() {
    if (muted) return;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* 等待首次交互 */ });
  }

  document.addEventListener('pointerdown', function () { startIfAllowed(); }, { capture: true });
  document.addEventListener('keydown', function () { startIfAllowed(); }, { capture: true });

  /* ---- 实验音频避让 ----
   * 通过拦截 HTMLMediaElement.prototype.play，无论音频元素是否挂在
   * DOM 上（sound.js 的降级播放用的是游离 Audio 元素），都能感知 */
  var active = new Set();
  var origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (this !== audio) {
      active.add(this);
      if (!audio.paused) audio.pause();
    }
    return origPlay.apply(this, arguments);
  };

  setInterval(function () {
    active.forEach(function (el) { if (el.paused || el.ended) active.delete(el); });
    if (!active.size && !muted && audio.paused) startIfAllowed();
  }, 450);

  /* ---- 小型开关按钮（柔光胶囊风格，不改变页面布局） ---- */
  var NOTE_ON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  var NOTE_OFF = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bgm-toggle' + (muted ? ' is-muted' : '');
  btn.title = muted ? '开启背景音乐' : '关闭背景音乐';
  btn.setAttribute('aria-label', btn.title);
  btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
  btn.innerHTML = muted ? NOTE_OFF : NOTE_ON;

  /* 「了解更多」页语言切换位置更低，开关相应下移避让 */
  if (document.querySelector('.hl-page')) btn.style.top = '158px';

  btn.addEventListener('click', function () {
    muted = !muted;
    try { localStorage.setItem(LS_MUTE, muted ? '1' : '0'); } catch (e) {}
    btn.classList.toggle('is-muted', muted);
    btn.title = muted ? '开启背景音乐' : '关闭背景音乐';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.innerHTML = muted ? NOTE_OFF : NOTE_ON;
    if (muted) { audio.pause(); }
    else { startIfAllowed(); }   /* 点击本身就是交互，播放权限已解锁 */
  });

  document.body.appendChild(btn);

  /* ---- 启动 ---- */
  if (!muted) startIfAllowed();
})();
