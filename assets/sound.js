/* 声音实验页：播放器 + Web Audio 实时音效
   纯原生脚本，无模块化写法，本地与线上都能运行 */
(function () {
  'use strict';

  /* ---------- 磁带配置：以后每盘磁带在这里加一行 ---------- */
  var TAPES = [
    {
      title: { zh: '广场舞', en: 'Square Dancing' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-01.m4a',
      embed: 'tape-01',
      img: 'assets/img/tape-01.png'
    },
    {
      title: { zh: '车站', en: 'Station' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-02.m4a',
      embed: 'tape-02',
      img: 'assets/img/tape-02.png'
    },
    {
      title: { zh: '市场', en: 'Market' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-03.m4a',
      embed: 'tape-03',
      img: 'assets/img/tape-03.png'
    },
    {
      title: { zh: '小狗的叫声', en: 'Dog Barks' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-04.m4a',
      embed: 'tape-04',
      img: 'assets/img/tape-04.png'
    },
    {
      title: { zh: '棋牌室', en: 'Chess & Card Room' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-05.m4a',
      embed: 'tape-05',
      img: 'assets/img/tape-05.png'
    },
    {
      title: { zh: '房间里的收音机', en: 'Radio in the Room' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-06.m4a',
      embed: 'tape-06',
      img: 'assets/img/tape-06.png'
    },
    {
      title: { zh: '虫鸣', en: 'Insect Song' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-07.m4a',
      embed: 'tape-07',
      img: 'assets/img/tape-07.png'
    },
    {
      title: { zh: '森林里的鸟', en: 'Birds in the Forest' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-08.m4a',
      embed: 'tape-08',
      img: 'assets/img/tape-08.png'
    },
    {
      title: { zh: '风声', en: 'The Wind' },
      sub: { zh: '', en: '' },
      src: 'assets/audio/tape-09.m4a',
      embed: 'tape-09',
      img: 'assets/img/tape-09.png'
    }
  ];

  /* 本地直接打开(file://)时浏览器会拦截对外部音频文件的实时处理，
     此时改用 base64 内嵌音频，滑块效果完整可用；线上则用普通文件 */
  var IS_FILE = window.location.protocol === 'file:';

  function tapeSrc(t) {
    if (IS_FILE && window.EMBEDDED_AUDIO && window.EMBEDDED_AUDIO[t.embed]) {
      return window.EMBEDDED_AUDIO[t.embed];
    }
    return t.src;
  }

  var params = new URLSearchParams(window.location.search);
  var tapeIndex = Math.min(Math.max(parseInt(params.get('t'), 10) || 0, 0), TAPES.length - 1);

  var media = document.getElementById('media');
  var btnPlay = document.getElementById('btn-play');
  var btnMute = document.getElementById('btn-mute');
  var btnLoop = document.getElementById('btn-loop');
  var btnReset = document.getElementById('btn-reset');
  var progress = document.getElementById('progress');
  var barFill = document.getElementById('bar-fill');
  var timeTotal = document.getElementById('time-total');
  var titleEl = document.getElementById('tape-title');
  var subEl = document.getElementById('tape-sub');
  var photoEl = document.getElementById('tape-photo');
  var drawnEl = document.getElementById('tape-drawn');
  var noticeEl = document.getElementById('notice');
  var fxs = Array.prototype.slice.call(document.querySelectorAll('.fx'));

  function lang() {
    return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'zh';
  }

  /* ---------- 磁带切换 ---------- */
  function loadTape(i) {
    tapeIndex = (i + TAPES.length) % TAPES.length;
    var t = TAPES[tapeIndex];
    var l = lang();

    media.src = tapeSrc(t);
    media.load();

    titleEl.setAttribute('data-zh', t.title.zh);
    titleEl.setAttribute('data-en', t.title.en);
    subEl.setAttribute('data-zh', t.sub.zh);
    subEl.setAttribute('data-en', t.sub.en);
    titleEl.textContent = t.title[l];
    subEl.textContent = t.sub[l];
    subEl.hidden = !t.sub[l];

    /* 有真实磁带图就显示图，没有则显示代码画的磁带 */
    if (t.img) {
      photoEl.src = t.img;
      photoEl.alt = t.title[l];
      photoEl.hidden = false;
      drawnEl.style.display = 'none';
    } else {
      photoEl.hidden = true;
      photoEl.removeAttribute('src');
      drawnEl.style.display = '';
    }

    barFill.style.width = '0';
    timeTotal.textContent = '--:--';
    resetFx();
  }

  document.querySelector('.arrow-prev').addEventListener('click', function () { loadTape(tapeIndex - 1); });
  document.querySelector('.arrow-next').addEventListener('click', function () { loadTape(tapeIndex + 1); });

  /* ---------- 播放控制 ---------- */
  function bindMedia(el) {
    el.addEventListener('timeupdate', function () {
      if (el.duration) {
        barFill.style.width = (el.currentTime / el.duration * 100) + '%';
        progress.setAttribute('aria-valuenow', Math.round(el.currentTime / el.duration * 100));
      }
    });
    el.addEventListener('loadedmetadata', function () {
      var m = Math.floor(el.duration / 60);
      var s = Math.floor(el.duration % 60);
      timeTotal.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    });
    el.addEventListener('ended', function () {
      btnPlay.classList.remove('is-playing');
    });
    el.addEventListener('play', function () { btnPlay.classList.add('is-playing'); });
    el.addEventListener('pause', function () { btnPlay.classList.remove('is-playing'); });
  }
  bindMedia(media);

  btnPlay.addEventListener('click', function () {
    if (!audioReady && !plainMode) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (media.paused) {
      var p = media.play();
      if (p && p.catch) p.catch(function () {});
      if (!checked) monitorSilence();
    } else {
      media.pause();
    }
  });

  btnMute.addEventListener('click', function () {
    media.muted = !media.muted;
    btnMute.classList.toggle('is-on', media.muted);
  });

  btnLoop.addEventListener('click', function () {
    media.loop = !media.loop;
    btnLoop.classList.toggle('is-on', media.loop);
  });

  progress.addEventListener('click', function (e) {
    var rect = progress.querySelector('.bar').getBoundingClientRect();
    var ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    if (media.duration) media.currentTime = ratio * media.duration;
  });

  progress.addEventListener('keydown', function (e) {
    if (!media.duration) return;
    if (e.key === 'ArrowRight') { media.currentTime = Math.min(media.currentTime + 5, media.duration); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { media.currentTime = Math.max(media.currentTime - 5, 0); e.preventDefault(); }
  });

  /* ---------- Web Audio 实时音效 ---------- */
  var audioCtx = null, audioReady = false, plainMode = false, checked = false;
  var srcNode, lp, comp, shaper, delay, fb, wet, dry, master, analyser;
  var fxInputs = fxs.map(function (fx) { return fx.querySelector('input'); });

  function makeCurve(k) {
    var n = 1024, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = i * 2 / n - 1;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function initAudio() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();

      srcNode = audioCtx.createMediaElementSource(media);
      lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 20000;

      comp = audioCtx.createDynamicsCompressor();
      comp.threshold.value = 0;
      comp.ratio.value = 1;
      comp.knee.value = 30;
      comp.attack.value = 0.01;
      comp.release.value = 0.25;

      shaper = audioCtx.createWaveShaper();

      /* 04 声音模糊：短延迟叠加，模拟频率分辨能力下降后的混叠感 */
      delay = audioCtx.createDelay(0.2);
      delay.delayTime.value = 0.012;
      fb = audioCtx.createGain();
      fb.gain.value = 0;
      wet = audioCtx.createGain();
      wet.gain.value = 0;
      dry = audioCtx.createGain();
      dry.gain.value = 1;

      master = audioCtx.createGain();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;

      srcNode.connect(lp);
      lp.connect(comp);
      comp.connect(shaper);
      shaper.connect(dry);
      shaper.connect(delay);
      delay.connect(wet);
      delay.connect(fb);
      fb.connect(delay);
      dry.connect(master);
      wet.connect(master);
      master.connect(audioCtx.destination);
      master.connect(analyser);

      audioReady = true;
      applyFx();
    } catch (err) {
      plainMode = true;
      showNotice();
    }
  }

  function applyFx() {
    if (!audioReady) return;
    var v1 = fxInputs[0].value / 100;
    var v2 = fxInputs[1].value / 100;
    var v3 = fxInputs[2].value / 100;
    var v4 = fxInputs[3].value / 100;

    /* 01 高频声音：低通滤波，滑块越大高频弱化越明显 */
    lp.frequency.value = v1 > 0 ? 20000 * Math.pow(0.045, v1) : 20000;

    /* 02 响度压缩：阈值压低、压缩比加大，缩小强弱感知范围 */
    comp.threshold.value = v2 > 0 ? -v2 * 45 : 0;
    comp.ratio.value = 1 + v2 * 11;

    /* 03 失真：波形成形 */
    shaper.curve = v3 > 0 ? makeCurve(v3 * 50) : null;

    /* 04 声音模糊：延迟湿声混合 */
    delay.delayTime.value = 0.012 + v4 * 0.045;
    fb.gain.value = v4 * 0.55;
    wet.gain.value = v4 * 0.8;
    dry.gain.value = 1 - v4 * 0.5;
  }

  /* 部分浏览器在本地协议下会拦截音频处理，自动降级为原声播放 */
  var buf = new Float32Array(1024);
  var silentChecks = 0, lastTime = 0;

  function monitorSilence() {
    if (checked || !analyser || plainMode) return;
    analyser.getFloatTimeDomainData(buf);
    var max = 0;
    for (var i = 0; i < buf.length; i++) {
      var a = Math.abs(buf[i]);
      if (a > max) max = a;
    }
    var advanced = media.currentTime - lastTime > 0.05;
    lastTime = media.currentTime;
    if (advanced && max < 0.0006) { silentChecks++; } else { silentChecks = 0; }
    if (silentChecks >= 5) { fallbackPlain(); return; }
    setTimeout(monitorSilence, 250);
  }

  function fallbackPlain() {
    checked = true;
    plainMode = true;
    var t = media.currentTime, wasPlaying = !media.paused, loop = media.loop;
    try { audioCtx.close(); } catch (e) {}
    var fresh = new Audio(media.currentSrc || media.src);
    fresh.loop = loop;
    bindMedia(fresh);
    media = fresh;
    fresh.currentTime = t;
    if (wasPlaying) {
      var p = fresh.play();
      if (p && p.catch) p.catch(function () {});
    }
    showNotice();
  }

  function showNotice() {
    noticeEl.textContent = lang() === 'zh'
      ? '当前打开方式不支持实时音效处理，已切换为原声播放。通过在线链接打开本页可体验完整的滤镜效果。'
      : 'Real-time audio processing is unavailable in the current mode; playing the original sound. Open this page via the online link to experience the full effects.';
    noticeEl.hidden = false;
    noticeEl.addEventListener('click', function () { noticeEl.hidden = true; }, { once: true });
  }

  /* ---------- 滑块 UI ---------- */
  var closeTimer = null;

  function openFx(fx) {
    clearTimeout(closeTimer);
    fxs.forEach(function (f) { f.classList.toggle('is-open', f === fx); });
  }

  fxInputs.forEach(function (input, idx) {
    var fx = fxs[idx];

    function onInput() {
      var v = input.value;
      input.style.setProperty('--val', v + '%');
      openFx(fx);
      applyFx();
      /* 触屏没有 hover，滑动结束后延迟收起 */
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { fx.classList.remove('is-open'); }, 4000);
    }

    input.addEventListener('input', onInput);
    input.addEventListener('pointerenter', function () { openFx(fx); });
    input.addEventListener('focus', function () { openFx(fx); });
  });

  function resetFx() {
    fxInputs.forEach(function (input) {
      input.value = 0;
      input.style.setProperty('--val', '0%');
    });
    fxs.forEach(function (f) { f.classList.remove('is-open'); });
    applyFx();
  }

  btnReset.addEventListener('click', resetFx);

  /* ---------- 初始化 ---------- */
  loadTape(tapeIndex);
})();
