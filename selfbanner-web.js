/**
 * SelfBanner Web — 웹 브라우저 접속 시 하단에 자체 앱 크로스프로모션 배너 표시
 * 앱 WebView 안에서는 window.IS_APP=true 이 주입되어 있어 렌더 스킵
 *
 * 플랫폼별 동작:
 *  - Android 모바일: Play Store 1개 버튼 (배너 전체 클릭)
 *  - iOS 모바일: App Store 1개 버튼 (iosUrl 있는 배너만)
 *  - 데스크탑: Play/App 둘 다 있으면 좌우 2열, 하나만 있으면 1열
 */
(function () {
  'use strict';

  if (window.IS_APP) return;

  var CLOSE_KEY = 'sb_closed_at';
  var CLOSE_TTL = 24 * 60 * 60 * 1000;
  try {
    var closedAt = parseInt(localStorage.getItem(CLOSE_KEY) || '0', 10);
    if (closedAt && Date.now() - closedAt < CLOSE_TTL) return;
  } catch (e) {}

  var BANNERS_URL = 'https://selfbanner.boolint.com/banners.json';
  var PLAY_STORE = 'https://play.google.com/store/apps/details?id=';

  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var isMobile = isIOS || isAndroid;
  var isDesktop = !isMobile;

  function hasIos(b) { return b.iosUrl && b.iosUrl.length > 0; }
  function hasAndroid(b) { return b.packageName && b.packageName.length > 0; }

  function pickBanner(list) {
    var country = (navigator.language || '').split('-')[1] || 'KR';
    var pool = list.filter(function (b) {
      if (!b.enabled) return false;
      var t = b.targetCountries || ['ALL'];
      if (t.indexOf('ALL') === -1 && t.indexOf(country) === -1) return false;
      // 모바일 iOS: iosUrl 있는 것만
      if (isIOS && !hasIos(b)) return false;
      // 모바일 Android / 데스크탑: 최소 하나의 스토어 링크 필요
      if (!isIOS && !hasAndroid(b) && !hasIos(b)) return false;
      return true;
    });
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function render(banner) {
    var lang = (navigator.language || 'ko').toLowerCase().startsWith('ko') ? 'ko' : 'en';
    var title = banner.title[lang] || banner.title.ko;
    var desc = banner.description[lang] || banner.description.ko;
    var playUrl = hasAndroid(banner) ? PLAY_STORE + banner.packageName : '';
    var iosUrl = hasIos(banner) ? banner.iosUrl : '';

    // 모바일은 배너 전체가 단일 링크
    var primaryUrl = isIOS ? iosUrl : playUrl;

    // 데스크탑 액션 버튼들
    var actions = '';
    if (isDesktop) {
      var btns = [];
      if (playUrl) btns.push('<a href="' + playUrl + '" target="_blank" rel="noopener" class="sb-btn sb-play">Play Store</a>');
      if (iosUrl) btns.push('<a href="' + iosUrl + '" target="_blank" rel="noopener" class="sb-btn sb-app">App Store</a>');
      actions = '<div class="sb-actions">' + btns.join('') + '</div>';
    }

    var wrap = document.createElement('div');
    wrap.id = 'selfbanner-web';

    var coreHtml =
      '<img src="' + banner.image + '" alt="" class="sb-img">' +
      '<div class="sb-text">' +
        '<div class="sb-title">' + title + '</div>' +
        '<div class="sb-desc">' + desc + '</div>' +
      '</div>';

    if (isDesktop) {
      wrap.innerHTML =
        '<div class="sb-core">' + coreHtml + '</div>' +
        actions +
        '<button class="sb-close" aria-label="close">×</button>';
    } else {
      wrap.innerHTML =
        '<a href="' + primaryUrl + '" target="_blank" rel="noopener" class="sb-link">' +
          coreHtml +
        '</a>' +
        '<button class="sb-close" aria-label="close">×</button>';
    }

    document.body.appendChild(wrap);
    document.body.style.paddingBottom = (isDesktop ? 84 : 76) + 'px';

    wrap.querySelector('.sb-close').addEventListener('click', function () {
      try { localStorage.setItem(CLOSE_KEY, String(Date.now())); } catch (e) {}
      wrap.remove();
      document.body.style.paddingBottom = '';
    });
  }

  function injectStyle() {
    var css =
      '#selfbanner-web{position:fixed;left:0;right:0;bottom:0;z-index:99999;' +
      'display:flex;align-items:center;gap:12px;padding:10px 14px;' +
      'background:var(--card-bg,#fff);color:var(--text,#1a1a2e);' +
      'border-top:1px solid var(--border,#e5e7eb);' +
      'box-shadow:0 -2px 12px rgba(0,0,0,.08);font-family:inherit}' +
      '#selfbanner-web .sb-link,#selfbanner-web .sb-core{flex:1;display:flex;align-items:center;gap:12px;' +
      'text-decoration:none;color:inherit;min-width:0}' +
      '#selfbanner-web .sb-img{width:48px;height:48px;border-radius:10px;flex-shrink:0;object-fit:cover}' +
      '#selfbanner-web .sb-text{min-width:0;flex:1}' +
      '#selfbanner-web .sb-title{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#selfbanner-web .sb-desc{font-size:12px;color:var(--text-muted,#6b7280);margin-top:2px;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#selfbanner-web .sb-actions{display:flex;gap:8px;flex-shrink:0}' +
      '#selfbanner-web .sb-btn{padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;' +
      'text-decoration:none;white-space:nowrap;transition:opacity .15s}' +
      '#selfbanner-web .sb-btn:hover{opacity:.85}' +
      '#selfbanner-web .sb-play{background:#10b981;color:#fff}' +
      '#selfbanner-web .sb-app{background:#1a1a2e;color:#fff}' +
      '#selfbanner-web .sb-close{background:none;border:none;font-size:24px;line-height:1;' +
      'cursor:pointer;color:var(--text-muted,#6b7280);padding:4px 8px;flex-shrink:0}' +
      '#selfbanner-web .sb-close:hover{color:var(--text,#1a1a2e)}' +
      '@media (max-width:480px){#selfbanner-web .sb-desc{display:none}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function start() {
    injectStyle();
    fetch(BANNERS_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var banner = pickBanner(data.banners || []);
        if (banner) render(banner);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
