/* 幕后故事页：隐藏区块（献给爷爷奶奶）滑入视口时淡入上浮 + 下滑提示淡出
   说明：用「滚动位置计算」而不是 IntersectionObserver，任何浏览器都生效。 */
(function () {
  'use strict';

  var sec = document.querySelector('.bts-dedicate');
  var hint = document.querySelector('.scroll-hint');
  if (!sec) return;

  var revealed = false;

  /* 隐藏区块是否已经露出足够多（露出视口内 40px 即触发） */
  function reveal() {
    if (revealed) return;
    var r = sec.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < vh - 40 && r.bottom > 0) {
      revealed = true;
      sec.classList.add('is-visible');
      if (hint) hint.style.opacity = '0';
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  }

  /* 下滑提示：一旦开始下滑就淡出 */
  function onScroll() {
    if (window.pageYOffset > 40 || window.scrollY > 40) {
      document.body.classList.add('is-scrolled');
    }
    reveal();
  }

  /* rAF 节流，避免滚动时高频计算 */
  var ticking = false;
  function onScrollThrottled() {
    if (ticking) return;
    ticking = true;
    (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
      ticking = false;
      onScroll();
    });
  }

  window.addEventListener('scroll', onScrollThrottled, { passive: true });
  window.addEventListener('resize', onScrollThrottled);
  window.addEventListener('hashchange', function () { setTimeout(reveal, 260); });

  /* 进入页面时先检查一次（例如带 #dedicate 打开、或浏览器恢复了滚动位置） */
  onScroll();
  setTimeout(reveal, 300);

  /* 点下滑提示 → 平滑滚到隐藏区块 */
  if (hint) {
    hint.addEventListener('click', function (e) {
      if (typeof sec.scrollIntoView === 'function') {
        e.preventDefault();
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(reveal, 400);
      }
    });
  }
})();
