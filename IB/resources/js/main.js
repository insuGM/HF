/* ==========================================================================
   IB(PC) 인터넷 금융서비스 메인 전용 스크립트
   - 기존 js 는 수정하지 않고 이 파일만 추가로 로드한다.
   - jQuery 없이 동작(순수 DOM). include.js 로 header/footer 가 늦게 붙으므로
     로그인 상태 반영은 DOM 변화를 한 번 더 감시한다.
   ========================================================================== */
(function () {
    'use strict';

    /* ------------------------------------------------ 1. 사이드 카드 슬라이드 */
    function initSlider(root) {
        var slides = root.querySelectorAll('[data-slide]');
        var dots = root.querySelectorAll('.ib_dots button');
        if (!slides.length || !dots.length) return;

        function show(i) {
            for (var n = 0; n < slides.length; n++) {
                slides[n].hidden = (n !== i);
            }
            for (var d = 0; d < dots.length; d++) {
                dots[d].classList.toggle('on', d === i);
                dots[d].setAttribute('aria-selected', d === i ? 'true' : 'false');
            }
        }
        for (var k = 0; k < dots.length; k++) {
            (function (idx) {
                dots[idx].addEventListener('click', function () { show(idx); });
            })(k);
        }
        show(0);
    }

    /* ------------------------------------------------ 2. 보유상품 탭 */
    function initOwnTabs(root) {
        var tabs = root.querySelectorAll('.ib_own_tab');
        if (tabs.length < 2) return;

        function select(btn) {
            for (var i = 0; i < tabs.length; i++) {
                var on = (tabs[i] === btn);
                tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
                var panelId = tabs[i].getAttribute('aria-controls');
                var panel = panelId && document.getElementById(panelId);
                if (panel) panel.hidden = !on;
            }
        }
        for (var t = 0; t < tabs.length; t++) {
            tabs[t].addEventListener('click', function () { select(this); });
        }
    }

    /* ------------------------------------------------ 3. FAQ 캐러셀 */
    function initFaq(root) {
        var wrap = root.querySelector('.ib_faq_wrap');
        if (!wrap) return;
        var list = wrap.querySelector('.ib_faq');
        var items = list ? list.children : [];
        var prev = wrap.querySelector('.ib_faq_nav.prev');
        var next = wrap.querySelector('.ib_faq_nav.next');
        if (!list || items.length < 2) return;

        var per = 3, at = 0;
        function max() { return Math.max(0, items.length - per); }
        function render() {
            for (var i = 0; i < items.length; i++) {
                items[i].hidden = (i < at || i >= at + per);
            }
            if (prev) prev.disabled = (at <= 0);
            if (next) next.disabled = (at >= max());
        }
        if (prev) prev.addEventListener('click', function () { at = Math.max(0, at - 1); render(); });
        if (next) next.addEventListener('click', function () { at = Math.min(max(), at + 1); render(); });
        render();
    }

    /* ------------------------------------------------ 4. TOP 버튼 */
    function initTop(root) {
        var btn = root.querySelector('.ib_top_btn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ------------------------------------------------ 5. 로그인 상태 헤더 반영
       inc/header.html 은 모든 페이지 공용이라 수정하지 않는다.
       메인에서 <body data-auth="in"> 인 경우에만 '로그인' 버튼을 'My HF' 로 바꾼다. */
    function applyAuth() {
        if (document.body.getAttribute('data-auth') !== 'in') return false;
        var login = document.querySelector('#krds-header .btn-navi.login');
        if (!login) return false;                       // header 아직 미삽입
        if (login.getAttribute('data-auth-applied')) return true;

        var my = document.createElement('a');
        my.className = 'btn-navi my last';
        my.setAttribute('href', '/html/user/login.html');
        my.setAttribute('data-auth-applied', '1');
        my.textContent = 'My HF';
        login.parentNode.replaceChild(my, login);
        return true;
    }

    function watchHeader() {
        if (applyAuth()) return;
        var mo = new MutationObserver(function () {
            if (applyAuth()) mo.disconnect();
        });
        mo.observe(document.body, { childList: true, subtree: true });
        // include.js 가 실패해도 무한 감시하지 않도록 상한
        setTimeout(function () { mo.disconnect(); }, 5000);
    }

    /* ------------------------------------------------ init */
    function init() {
        var root = document.querySelector('.ib_main');
        if (root) {
            initSlider(root);
            initOwnTabs(root);
            initFaq(root);
            initTop(root);
        }
        watchHeader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
