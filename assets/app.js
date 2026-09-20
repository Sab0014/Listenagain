/* 语言切换：纯原生脚本，本地直接打开也能用 */
(function () {
  'use strict';

  var btns = document.querySelectorAll('.lang-btn');

  function setLang(lang) {
    var nodes = document.querySelectorAll('[data-zh]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var text = lang === 'zh' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (text) el.textContent = text;
    }
    for (var j = 0; j < btns.length; j++) {
      btns[j].classList.toggle('active', btns[j].getAttribute('data-lang') === lang);
    }
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
  }

  for (var k = 0; k < btns.length; k++) {
    btns[k].addEventListener('click', function () {
      setLang(this.getAttribute('data-lang'));
    });
  }
})();
