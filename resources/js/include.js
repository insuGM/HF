/* ------------------------------------------------------------------
   팝업/바텀시트 열고 닫을 때 배경 스크롤 위치를 그대로 유지한다.
   - 열 때 : 현재 위치를 기억하고 배경 스크롤을 잠근다
   - 닫을 때 : 잠금을 풀고 기억해 둔 위치로 되돌린다
   - 포커스 이동(preventScroll)으로도 화면이 끌려가지 않게 한다
   ------------------------------------------------------------------ */
// 팝업을 열기 직전의 스크롤 위치 (닫을 때 그대로 돌려놓는다)
var savedScroll = null;

function getScrollTop() {
    return window.pageYOffset
        || document.documentElement.scrollTop
        || document.body.scrollTop
        || 0;
}

function setScrollTop(y) {
    // 전역 smooth 스크롤의 영향을 받지 않고 같은 프레임에서 위치를 복원한다.
    var root = document.documentElement;
    var behavior = root.style.getPropertyValue('scroll-behavior');
    var priority = root.style.getPropertyPriority('scroll-behavior');
    root.style.setProperty('scroll-behavior', 'auto', 'important');
    try {
        if (typeof window.scrollTo === 'function') {
            window.scrollTo({ left: window.pageXOffset || 0, top: y, behavior: 'instant' });
        } else {
            (document.scrollingElement || root).scrollTop = y;
        }
    } finally {
        if (behavior) root.style.setProperty('scroll-behavior', behavior, priority);
        else root.style.removeProperty('scroll-behavior');
    }
}

// 잠글 때 건드린 인라인 스타일 (풀 때 원래대로 되돌리려고 보관)
var lockedStyle = null;

// 사라지는 스크롤바 폭 (scrollbar-gutter 를 지원하면 보정할 필요 없음)
function scrollbarWidth() {
    if (window.CSS && CSS.supports && CSS.supports('scrollbar-gutter', 'stable')) return 0;
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth);
}

/* 배경 스크롤 잠금.
   overflow:hidden 만 걸면 스크롤 자체가 사라져 배경이 맨 위로 잘렸다가
   풀 때 다시 내려오면서 화면이 튄다. 그래서 배경을 지금 보이는 그 자리에
   position:fixed 로 붙여 둔다. 배경은 1px 도 움직이지 않는다. */
function lockScroll() {
    if (lockedStyle) return;                       // 이미 잠겨 있으면(겹쳐 열기) 그대로
    var y = getScrollTop();
    savedScroll = y;
    var body = document.body;
    lockedStyle = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        paddingRight: body.style.paddingRight,
        overflow: body.style.overflow
    };
    var sbw = scrollbarWidth();
    body.style.position = 'fixed';
    body.style.top = -y + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    // 스크롤바가 사라지며 생기는 가로 밀림 보정
    if (sbw > 0) body.style.paddingRight = sbw + 'px';
}

// 잠금 해제 : 스타일을 되돌리고 기억해 둔 위치로 정확히 복귀
function unlockScroll() {
    if (!lockedStyle) return;
    var body = document.body;
    body.style.position = lockedStyle.position;
    body.style.top = lockedStyle.top;
    body.style.left = lockedStyle.left;
    body.style.right = lockedStyle.right;
    body.style.width = lockedStyle.width;
    body.style.paddingRight = lockedStyle.paddingRight;
    body.style.overflow = lockedStyle.overflow;
    lockedStyle = null;
    // 예전 코드가 html 에 걸어 둔 잠금이 남아 있을 수 있으니 같이 정리
    document.documentElement.style.overflow = '';
    if (savedScroll !== null) {
        var y = savedScroll;
        savedScroll = null;
        setScrollTop(y);
    }
}

// 포커스 이동이 화면을 끌고 가지 않도록 (미지원 브라우저는 그냥 focus)
function focusNoScroll(el) {
    if (!el || typeof el.focus !== 'function') return;
    try {
        el.focus({ preventScroll: true });
    } catch (e) {
        var y = getScrollTop();
        el.focus();
        setScrollTop(y);
    }
}



async function includeHTML() {
    const elements = document.querySelectorAll('[data-include]');
    
    console.log(`[include.js] Found ${elements.length} elements with data-include`);
    
    for (const element of elements) {
        const file = element.getAttribute('data-include');
        console.log(`[include.js] Loading: ${file}`);
        
        try {
            const response = await fetch(file);
            if (response.ok) {
                const html = await response.text();
                console.log(`[include.js] Successfully loaded: ${file}`);
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                const scripts = Array.from(tempDiv.querySelectorAll('script'));
                const scriptContents = scripts.map(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.textContent = oldScript.textContent;
                    oldScript.remove();
                    return newScript;
                });
                
                const parent = element.parentNode;
                const nextSibling = element.nextSibling;
                
                while (tempDiv.firstChild) {
                    parent.insertBefore(tempDiv.firstChild, nextSibling);
                }
                
                parent.removeChild(element);
                
                scriptContents.forEach(script => {
                    if (nextSibling) {
                        parent.insertBefore(script, nextSibling);
                    } else {
                        parent.appendChild(script);
                    }
                });
            } else {
                console.error(`[include.js] Failed to load ${file}: ${response.status} ${response.statusText}`);
                console.error(`[include.js] Requested URL: ${response.url || file}`);
            }
        } catch (error) {
            console.error(`[include.js] Error loading ${file}:`, error);
            console.error(`[include.js] Error details:`, error.message, error.stack);
        }
    }

    document.dispatchEvent(new CustomEvent('hf-include-done'));
    
    setTimeout(function() {
        if (typeof windowSize !== 'undefined' && typeof windowSize.setWinSize === 'function') {
            windowSize.setWinSize();
        }

        const componentMap = {
            'krds_mainMenuPC': typeof krds_mainMenuPC !== 'undefined' ? krds_mainMenuPC : null,
            'krds_mainMenuMobile': typeof krds_mainMenuMobile !== 'undefined' ? krds_mainMenuMobile : null,
            'krds_sideNavigation': typeof krds_sideNavigation !== 'undefined' ? krds_sideNavigation : null,
            'krds_tab': typeof krds_tab !== 'undefined' ? krds_tab : null,
            'krds_accordion': typeof krds_accordion !== 'undefined' ? krds_accordion : null,
            'krds_modal': typeof krds_modal !== 'undefined' ? krds_modal : null,
            'krds_contextualHelp': typeof krds_contextualHelp !== 'undefined' ? krds_contextualHelp : null,
            'krds_tooltip': typeof krds_tooltip !== 'undefined' ? krds_tooltip : null,
            'krds_disclosure': typeof krds_disclosure !== 'undefined' ? krds_disclosure : null,
            'krds_dropEvent': typeof krds_dropEvent !== 'undefined' ? krds_dropEvent : null,
            'krds_calendar': typeof krds_calendar !== 'undefined' ? krds_calendar : null,
            'krds_inPageNavigation': typeof krds_inPageNavigation !== 'undefined' ? krds_inPageNavigation : null,
            'krds_adjustContentScale': typeof krds_adjustContentScale !== 'undefined' ? krds_adjustContentScale : null,
            'krds_toggleSwitch': typeof krds_toggleSwitch !== 'undefined' ? krds_toggleSwitch : null,
            'krds_infoList': typeof krds_infoList !== 'undefined' ? krds_infoList : null,
            'krds_chkBox': typeof krds_chkBox !== 'undefined' ? krds_chkBox : null,
            'krds_fileUpload': typeof krds_fileUpload !== 'undefined' ? krds_fileUpload : null,
            'krds_tts': typeof krds_tts !== 'undefined' ? krds_tts : null,
            'krds_helpPanel': typeof krds_helpPanel !== 'undefined' ? krds_helpPanel : null
        };

        Object.keys(componentMap).forEach(function(componentName) {
            const component = componentMap[componentName];
            if (component !== null && typeof component.init === 'function') {
                try {
                    component.init();
                } catch (e) {
                    console.error('Failed to reinitialize ' + componentName + ':', e);
                }
            }
        });

        if (typeof windowSize !== 'undefined' && typeof krds_helpPanel !== 'undefined') {
            if (windowSize.getWinSize() === 'pc' && typeof krds_helpPanel.toggleHelpPanel === 'function') {
                krds_helpPanel.toggleHelpPanel('open');
            }
        }

        if (typeof initDisplaySettings === 'function') {
            setTimeout(function() {
                initDisplaySettings();
            }, 100);
        }
    }, 300);
}

// DOM 로드 후 실행
(function() {
    console.log('[include.js] Script loaded, readyState:', document.readyState);
    
    function initInclude() {
        console.log('[include.js] Starting include process...');
        includeHTML().catch(function(error) {
            console.error('[include.js] Fatal error in includeHTML:', error);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInclude);
    } else {
        setTimeout(initInclude, 0);
    }
})();


/* ===================================================================
 * com_pop 팝업 (krds-modal 기능 이식판)
 * - 기존 com_pop_wrap / com_pop_cont / data-pop / .close 구조 유지 (HTML 변경 없음)
 * - krds_modal 기능 이식: ESC 닫기, 포커스 트랩, inert(배경 비활성),
 *   열 때 첫 포커스 이동, 스크롤 잠금, 닫을 때 트리거로 포커스 복귀,
 *   다중 팝업 z-index 관리, 바깥 클릭 닫힘(기존 유지)
 * =================================================================== */

(function () {
    'use strict';

    // 열린 팝업별 상태 저장 (닫을 때 정리용)
    var popState = new WeakMap();
    // 현재 열린 팝업 스택 (z-index / 스크롤 복원 판단)
    var openStack = [];


    var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex="0"], input:not([disabled]), textarea:not([disabled]), select:not([disabled])';

    // 배경으로 inert 처리할 셸 (팝업을 제외한 페이지 본문)
    function getShell(popWrap) {
        var shell = document.getElementById('container') || document.getElementById('app');
        if (shell && shell.contains(popWrap)) {
            // 팝업이 셸 내부에 있으면 셸에 inert를 걸 수 없음 → 상위로
            shell = document.getElementById('app');
            if (shell && shell.contains(popWrap)) shell = null;
        }
        return shell;
    }

    // 포커스 트랩 (krds focusTrap 이식)
    function makeTrapHandler(container) {
        return function (e) {
            if (e.key !== 'Tab') return;
            var focusables = container.querySelectorAll(FOCUSABLE);
            if (!focusables.length) return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
    }

    // 팝업 열기
    function openPop(popWrap, popCont, triggerBtn) {
        if (!popWrap || !popCont) return;
        if (popWrap.classList.contains('active')) return; // 중복 열기 방지

        // 스크롤 잠금 (현재 위치 기억)
        lockScroll();

        // 다중 팝업 z-index (krds: 1010 + n)
        openStack.push(popWrap);
        if (openStack.length > 1) {
            popWrap.style.zIndex = String(1010 + openStack.length);
        }

        // 활성화 + 트랜지션
        popWrap.classList.add('active');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                popWrap.style.opacity = '1';
            });
        });
        setTimeout(function () {
            popCont.classList.add('active');
        }, 300);

        if (typeof krds_disclosure !== 'undefined' && krds_disclosure.init) {
            krds_disclosure.init();
        }

        // 접근성 속성
        popWrap.setAttribute('role', 'dialog');
        popWrap.setAttribute('aria-modal', 'true');

        // 내용이 넘치면 스크롤 tabindex (krds modal-conts 처리 이식)
        var content = popWrap.querySelector('.com_pop_content') || popCont;
        if (content && content.scrollHeight > content.clientHeight) {
            content.setAttribute('tabindex', '0');
        } else if (content) {
            content.removeAttribute('tabindex');
        }

        // 첫 포커스 이동 (트랜지션 후)
        setTimeout(function () {
            var focusables = popCont.querySelectorAll(FOCUSABLE);
            if (focusables.length) focusNoScroll(focusables[0]);
            else popCont.setAttribute('tabindex', '-1'), focusNoScroll(popCont);
        }, 350);

        // 포커스 트랩
        var trapHandler = makeTrapHandler(popCont);
        popCont.addEventListener('keydown', trapHandler);

        // ESC 닫기
        var escHandler = function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closePop(popWrap, popCont, triggerBtn);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 배경 inert
        var shell = getShell(popWrap);
        if (shell) shell.setAttribute('inert', '');

        // 상태 저장
        popState.set(popWrap, {
            trapHandler: trapHandler,
            escHandler: escHandler,
            shell: shell,
            popCont: popCont,
            triggerBtn: triggerBtn
        });
    }

    // 팝업 닫기
    function closePop(popWrap, popCont, triggerBtn) {
        if (!popWrap) return;
        var state = popState.get(popWrap) || {};
        popCont = popCont || state.popCont || popWrap.querySelector('.com_pop_cont');
        triggerBtn = triggerBtn || state.triggerBtn;

        // 접근성 정리
        if (state.escHandler) document.removeEventListener('keydown', state.escHandler);
        if (state.trapHandler && popCont) popCont.removeEventListener('keydown', state.trapHandler);
        if (state.shell) state.shell.removeAttribute('inert');
        popState.delete(popWrap);

        // 스택에서 제거
        var idx = openStack.indexOf(popWrap);
        if (idx > -1) openStack.splice(idx, 1);

        // 닫기 트랜지션
        if (popCont) popCont.classList.remove('active');
        popWrap.style.opacity = '0';
        setTimeout(function () {
            popWrap.classList.remove('active');
            popWrap.style.zIndex = '';
        }, 300);

        // 마지막 팝업이 닫히면 스크롤 잠금 해제 + 열기 전 위치로 복원
        if (openStack.length === 0) {
            unlockScroll();
        }

        popWrap.removeAttribute('aria-modal');

        // 트리거로 포커스 복귀 (화면은 끌고 가지 않는다)
        focusNoScroll(triggerBtn);
    }

    // 전역 클릭 위임: 열기(data-pop) / 닫기(data-close-pop)
    document.addEventListener('click', function (e) {
        // 닫기 버튼 (data-close-pop)
        var closeBtn = e.target.closest('[data-close-pop]');
        if (closeBtn) {
            var cWrap = closeBtn.closest('.com_pop_wrap');
            if (cWrap) {
                var cCont = cWrap.querySelector('.com_pop_cont');
                closePop(cWrap, cCont, null);
            }
            return;
        }

        // 열기 버튼 (data-pop)
        var btn = e.target.closest('[data-pop]');
        if (!btn) return;

        var popTarget = btn.dataset.pop;
        var match = popTarget.match(/^(.*?)(\d+)?$/);
        var num = match[2] || '';
        var selector = num ? '.com_pop_wrap.type' + num : '.com_pop_wrap';
        var popWrap = document.querySelector(selector);
        if (!popWrap) return;

        var popCont = popWrap.querySelector('.com_pop_cont');
        openPop(popWrap, popCont, btn);

        // 바깥(딤) 클릭 닫힘 — 기존 기능 유지
        var outsideHandler = function (ev) {
            if (!popCont.contains(ev.target)) {
                closePop(popWrap, popCont, btn);
            }
        };
        // 열기 클릭 버블링으로 즉시 닫히는 것 방지 위해 다음 프레임에 바인딩
        setTimeout(function () {
            popWrap.addEventListener('click', outsideHandler);
            popWrap.addEventListener('touchend', outsideHandler);
        }, 0);

        // .close 버튼은 아래 '공통 닫기 위임'이 처리한다 (여기서 개별 바인딩하지 않음)
    });

    /* -----------------------------------------------------------------
     * 공통 닫기 위임
     * 팝업이 어떻게 열렸든 닫히게 한다 :
     *   (1) data-pop 버튼으로 연 팝업
     *   (2) 마크업에 active 로 이미 열려 있는 팝업 (퍼블 상태별 화면 다수)
     *   (3) 다른 스크립트가 active 를 붙여 연 팝업
     * 이전에는 data-pop 클릭 시점에 popWrap.querySelector('.close') 하나에만
     * 바인딩해서 (2)(3) 은 닫기가 아예 동작하지 않았다.
     * (팝업 안에 .close 가 2개 이상일 때 첫 번째만 걸리던 문제도 같이 해소된다)
     * ----------------------------------------------------------------- */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.com_pop_wrap .close, .com_pop_wrap .end');
        if (!btn) return;
        // 새 팝업을 여는 클릭은 상위 .end/.close의 닫기 동작으로 처리하지 않는다.
        if (e.target.closest('[data-pop]')) return;

        var popWrap = btn.closest('.com_pop_wrap');
        if (!popWrap || !popWrap.classList.contains('active')) return;

        // 딤(바깥) 클릭 핸들러는 .com_pop_cont 내부 클릭을 무시하므로
        // 여기서 stopPropagation 은 불필요하다 (window 레벨 리스너만 막게 된다)
        if (btn.tagName === 'A' && !btn.getAttribute('href')) e.preventDefault();

        closePop(popWrap, popWrap.querySelector('.com_pop_cont'), null);
    });

    // 특정 시점에 모든(또는 특정 type 제외) 팝업 닫기 — 기존 data-hide="end" 기능 유지
    document.addEventListener('click', function (e) {
        var hideBtn = e.target.closest('[data-hide="end"]');
        if (!hideBtn) return;

        var openBtn = e.target.closest('[data-pop]');
        var currentPop = openBtn ? openBtn.dataset.pop : hideBtn.dataset.pop;
        var parentFull = openBtn ? openBtn.closest('.com_pop_wrap.full.active') : null;
        var targetMatch = currentPop ? currentPop.match(/(\d+)$/) : null;
        var targetPop = currentPop ? document.querySelector(
            targetMatch ? '.com_pop_wrap.type' + targetMatch[1] : '.com_pop_wrap'
        ) : null;
        var keepFull = parentFull && targetPop && !targetPop.classList.contains('full');
        document.querySelectorAll('.com_pop_wrap').forEach(function (popWrap) {
            // 풀팝업 위에 바텀시트를 여는 경우 배경 풀팝업과 그 조상은 유지한다.
            if (keepFull && (popWrap === parentFull || popWrap.contains(parentFull))) return;
            var match = currentPop ? currentPop.match(/^(.*?)(\d+)?$/) : null;
            var num = match ? (match[2] || '') : '';
            var selector = num ? '.com_pop_wrap.type' + num : '.com_pop_wrap:not([class*="type"])';
            if (currentPop && popWrap.matches(selector)) return;

            var popCont = popWrap.querySelector('.com_pop_cont');
            closePop(popWrap, popCont, null);
        });
    });

    // 외부에서 호출 가능하도록 노출 (선택)
    window.comPop = { open: openPop, close: closePop };
})();

document.addEventListener('DOMContentLoaded', function() {
  const chkBtns = document.querySelectorAll('.sort_list_area .chk_btn');

  chkBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      chkBtns.forEach(function(el) {
        el.classList.remove('active');
      });
      this.classList.add('active');

      const popWrap = this.closest('[class*="_wrap"]');
      const popCont = popWrap ? popWrap.querySelector('.com_pop_cont') : null;


      if (popWrap) {
        const wrapClass = Array.from(popWrap.classList).find(c => c.includes('_wrap'));
        const num = wrapClass ? (wrapClass.match(/\d+$/) || [''])[0] : '';
        const baseName = wrapClass ? wrapClass.replace(/_wrap\d*$/, '') : '';
        const nextNum = num ? parseInt(num) + 1 : 2;
        const nextPopBtn = document.querySelector('[data-pop="' + baseName + nextNum + '"]');


        if (nextPopBtn) nextPopBtn.removeAttribute('disabled');

      }
    });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var PAD_OPEN = 'var(--hf-padding-6) var(--hf-padding-5)';
  var PAD_CLOSE = '0 var(--hf-padding-5)';

  // 요소가 나타난 뒤(인클루드 포함) 초기 접힘/펼침 상태를 1회 세팅
  function ensureInit(scope) {
    (scope || document).querySelectorAll('.faq_list_cont .list li .faq_content').forEach(function (el) {
      if (el.dataset.faqReady === '1') return;
      var li = el.closest('li');
      var open = li && li.classList.contains('active');
      el.style.transition = 'height 0.3s ease, opacity 0.3s ease, padding 0.3s ease';
      el.style.height = open ? 'auto' : '0';
      el.style.opacity = open ? '1' : '0';
      el.style.padding = open ? PAD_OPEN : PAD_CLOSE;
      el.dataset.faqReady = '1';
      var btn = li && li.querySelector('.cont');
      if (btn) {
        btn.setAttribute('title', open ? '펼침' : '접힘');
        var ic = btn.querySelector('i'); if (ic && open) ic.classList.add('up');
      }
    });
  }

  function closeItem(btn) {
    var li = btn.closest('li');
    var icon = btn.querySelector('i');
    var faqContent = li.querySelector('.faq_content');
    li.classList.remove('active');
    if (icon) icon.classList.remove('up');
    btn.setAttribute('title', '접힘');
    faqContent.style.height = faqContent.scrollHeight + 'px';
    faqContent.getBoundingClientRect(); // 강제 리플로우
    faqContent.style.height = '0';
    faqContent.style.opacity = '0';
    faqContent.style.padding = PAD_CLOSE;
  }

  // 이벤트 위임: 문서에 한 번만 → 언제 주입되든 클릭 동작
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.faq_list_cont .list li .cont');
    if (!btn) return;
    ensureInit(btn.closest('.faq_list_cont'));
    var li = btn.closest('li');
    var icon = btn.querySelector('i');
    var faqContent = li.querySelector('.faq_content');
    if (li.classList.contains('active')) {
      closeItem(btn);
    } else {
      li.closest('.list').querySelectorAll('li.active').forEach(function (other) {
        if (other !== li) closeItem(other.querySelector('.cont'));   // 다른 열린 항목 닫기
      });
      li.classList.add('active');
      if (icon) icon.classList.add('up');
      btn.setAttribute('title', '펼침');
      faqContent.style.height = faqContent.scrollHeight + 'px';
      faqContent.style.opacity = '1';
      faqContent.style.padding = PAD_OPEN;
      faqContent.addEventListener('transitionend', function handler(ev) {
        if (ev.propertyName === 'height') {
          faqContent.style.height = 'auto';
          faqContent.removeEventListener('transitionend', handler);
        }
      });
    }
  });

  ensureInit(document);
  // 나중에 주입되는 FAQ(footer 등) 초기 상태 보정
  if (window.MutationObserver) {
    new MutationObserver(function () { ensureInit(document); })
      .observe(document.body, { childList: true, subtree: true });
  }
});


document.addEventListener('hf-include-done', function() {
    const headerClass = sessionStorage.getItem('headerClass');
    if (headerClass) {
        const header = document.querySelector('header');
        if (header) header.classList.add(headerClass);
        sessionStorage.removeItem('headerClass');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[data-page]').forEach(function(link) {
        link.addEventListener('click', function() {
            sessionStorage.setItem('headerClass', this.dataset.page);
        });
    });
});

/* .end (팝업 안 확인/닫기 버튼) 도 위 '공통 닫기 위임'이 처리한다.
   여기서 로드 시점에 querySelectorAll 로 걸던 코드는 제거했다 —
   data-include 로 나중에 삽입되는 영역에는 바인딩되지 않아 닫기가 안 먹었다. */

document.addEventListener('DOMContentLoaded', function() {
  const inputs = document.querySelectorAll('input.inparea');
  inputs.forEach(function(input) {
    const tipArea = document.querySelector('.sch_tip_list_area');
    const schBtn = input.closest('.inp_area') ? input.closest('.inp_area').querySelector('.sch_btn') : null;
    const schCont = input.closest('.com_sch_cont');
    const bgLine = document.querySelector('.bg_line');
    const dataListArea = document.querySelector('.area_sch_data_list_area');

    if (!tipArea) return;

    tipArea.style.display = 'block';
    tipArea.style.opacity = '1';

    if (dataListArea) {
      dataListArea.style.display = 'none';
      dataListArea.style.opacity = '0';
      dataListArea.style.transition = 'opacity 0.3s ease';
    }

    function showDataList() {
      if (!dataListArea) return;
      dataListArea.style.display = 'flex';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          dataListArea.style.opacity = '1';
        });
      });
    }

    function hideDataList() {
      if (!dataListArea) return;
      dataListArea.style.opacity = '0';
      setTimeout(function() {
        dataListArea.style.display = 'none';
      }, 300);
    }

    function doSearch() {
      if (input.value.length === 0) {
        hideDataList();
        return;
      }

      if (schCont) schCont.classList.add('data-open');
      if (bgLine) bgLine.classList.remove('none');
      showDataList();
    }

    if (schBtn) {
      schBtn.addEventListener('click', doSearch);
    }

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        doSearch();
      }
    });

    input.addEventListener('input', function() {
      if (this.value.length > 0) {
        tipArea.style.opacity = '0';
        setTimeout(function() {
          tipArea.style.display = 'none';
        }, 300);
      } else { 
        hideDataList();
        tipArea.style.display = 'block';
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            tipArea.style.opacity = '1';
          });
        });
      }
    });

    input.addEventListener('blur', function() {
      if (input.value.length > 0) return;
      setTimeout(function() {
        tipArea.style.display = 'block';
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            tipArea.style.opacity = '1';
          });
        });
      }, 200);
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const listItems = document.querySelectorAll('.breakdown_list_area .list li');
  
  listItems.forEach(function(li) {
    const btn = li.querySelector('.cont');
    btn.setAttribute('title', '선택되지 않음');
  });

  listItems.forEach(function(li) {
    const btn = li.querySelector('.cont');
    
    btn.addEventListener('click', function() {
      listItems.forEach(function(item) {
        item.classList.remove('active');
        item.querySelector('.cont').setAttribute('title', '선택되지 않음');
      });
      
      li.classList.add('active');
      btn.setAttribute('title', '선택됨');
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const contBtns = document.querySelectorAll('.area_sch_data_list_area .list li .cont');
  const btnCont = document.querySelector('.btn_cont.none');

  contBtns.forEach(function(btn) {
    btn.setAttribute('title', '선택되지 않음');
  });

  if (btnCont && btnCont.classList.contains('none')) {
    btnCont.style.opacity = '0';
    btnCont.style.transition = 'opacity 0.3s ease';
  }

  contBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      // title 기능은 data-pop 여부 관계없이 항상 실행
      contBtns.forEach(function(el) {
        el.classList.remove('chk');
        el.setAttribute('title', '선택되지 않음');
      });
      this.classList.add('chk');
      this.setAttribute('title', '선택됨');

      // data-pop 있으면 이후 기능 중단
      if (this.hasAttribute('data-pop')) return;

        const firstTxt = this.querySelector('.txt_list_area .txt:first-child');
        const dataCont = document.querySelector('.btn_cont .area_sch_data_cont');

        if (firstTxt && dataCont) {
            const cloned = firstTxt.cloneNode(true);
            if (dataCont.firstChild) {
                dataCont.replaceChild(cloned, dataCont.firstChild);
            } else {
                dataCont.insertBefore(cloned, dataCont.firstChild);
            }
        }

      if (btnCont && btnCont.classList.contains('none')) {
        btnCont.classList.remove('none');
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            btnCont.style.opacity = '1';
          });
        });
      }
    });
  });
});

document.addEventListener('click', function(e) {
  const btn = e.target.closest('.tab_bar .hf_btn');
  if (!btn) return;

  document.querySelectorAll('.tab_bar .hf_btn').forEach(function(el) {
    el.classList.remove('on');
    el.removeAttribute('aria-current');
  });

  btn.classList.add('on');
  btn.setAttribute('aria-current', 'page');
});

document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-navi.all');
  if (!btn) return;

  const mobileMenu = document.querySelector('.krds-main-menu-mobile');
  if (!mobileMenu) return;

  setTimeout(function() {
    mobileMenu.style.display = 'block'; // 혹은 classList.add('active') 등
  }, 300);

  const header = document.querySelector('#krds-header');
  if (!header) return;

  // 클릭 시 무조건 팝업 전부 닫기
  document.querySelectorAll('.com_pop_wrap').forEach(function(popWrap) {
    const popCont = popWrap.querySelector('.com_pop_cont');
    if (popCont) popCont.classList.remove('active');
    popWrap.style.opacity = '0';
    setTimeout(function() {
      popWrap.classList.remove('active');
    }, 300);
  });

  setTimeout(function(){
    if (btn.classList.contains('active')) {
      header.style.zIndex = '70';
    } else {
      header.style.zIndex = '73';
    }
  },300);
});

document.addEventListener('click', function(e) {
  const closeBtn = e.target.closest('.krds-main-menu-mobile .gnb-wrap #close-nav');
  if (!closeBtn) return;

  const header = document.querySelector('#krds-header');
  if (!header) return;

  header.style.zIndex = '70';

  const allBtn = document.querySelector('.btn-navi.all');
  if (allBtn) {
    allBtn.classList.remove('on');
    allBtn.removeAttribute('aria-current');
  }
});


let rprsPopup = null;
let ptlPopup = null;

const ptlUserRegclsf = () => {
  if(ptlPopup != null) ptlPopup.close();
  let url = "https://ptl.anyid.go.kr/anyid/user/regclsf?userSeCd=01&srvcNo=9000000000";
  openPopup(url,640,800);
}

const ptlUserMngclsf = () => {
  if(ptlPopup != null) ptlPopup.close();
  let url = "https://ptl.anyid.go.kr/anyid/user/mngclsf?userSeCd=01&srvcNo=9000000000";
  openPopup(url,860,700);
}

const openPopup = (url, width, height) => {
  let left = (screen.width) ? (screen.width-width)/2 : 0;
  let top = (screen.height) ? (screen.height-height)/2 : 0;
  rprsPopup=window.open(url,"","resizable=yes,toolbar=no,scrollbars=yes,locatioon=no,top="+top+"px,left="+left+"px,width="+width+"px,height="+height+"px");
  if(rprsPopup){
    rprsPopup.focus();
  }
}
 
const popupClose = ()=> {
  window.close();
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (!document.querySelector('.app-main')) {
      const mainPop = document.querySelector('.com_pop_wrap.main');
      if (mainPop) mainPop.remove();
    }
  }, 300);
});


// krds_calendar init 호출
krds_calendar.init();

// krds_calendar_extend.js
// 기존 krds_calendar.init() 호출 이후에 로드

document.querySelectorAll('.form-btn-datepicker').forEach((button) => {
  button.addEventListener('click', function () {
    const wrap = document.querySelector('.com_pop_wrap.datepicker');
    if (!wrap) return;

    const cont = wrap.querySelector('.com_pop_cont');
    const calendarArea = wrap.querySelector('.krds-calendar-area');

    function closePop() {
      if (calendarArea) calendarArea.classList.remove('active');
      cont.classList.remove('active');
      wrap.style.opacity = '0';

      setTimeout(function () {
        wrap.classList.remove('active');
        wrap.style.opacity = '';
      }, 300);

      unlockScroll();

      button.setAttribute('aria-expanded', 'false');
      focusNoScroll(button);
    }

    function applyDate() {
    const selectedTd = calendarArea?.querySelector('td.period.start.end');
    if (!selectedTd) return;

    const selectedDate = selectedTd.getAttribute('data-date');
    if (!selectedDate) return;

    // wrap 안팎 모두 탐색
    const input = document.querySelector('.krds-input.datepicker');
    if (input) {
      input.setAttribute('type', 'text');
      input.value = selectedDate;
    }
  }

    if (wrap.classList.contains('active')) {
      closePop();
      return;
    }

    lockScroll();

    wrap.classList.add('active');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wrap.style.opacity = '1';
      });
    });

    setTimeout(function () {
      cont.classList.add('active');

      if (calendarArea) {
        calendarArea.classList.add('active');
        button.setAttribute('aria-expanded', 'true');

        if (typeof common !== 'undefined') {
          common.focusTrap(calendarArea);
        }

        setTimeout(function () {
          calendarArea.querySelector('.calendar-wrap')?.focus();
        }, 50);
      }

      // 확인 버튼 (기존 calendar-btn-wrap + 새로 추가된 com_btn)
      wrap.querySelectorAll('.krds-btn.primary').forEach((confirmBtn) => {
        confirmBtn.addEventListener('click', function () {
          applyDate();
          closePop();
        });
      });

    }, 300);

    wrap.addEventListener('click', function (e) {
      if (!cont.contains(e.target)) closePop();
    });

    wrap.addEventListener('touchend', function (e) {
      if (!cont.contains(e.target)) closePop();
    });

    const closeBtn = wrap.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closePop();
      });
    }
  });
});

function setupSlider(opts) {
  const track = opts.handle.parentElement;
  const handleWidth = opts.handle.offsetWidth || 64;
  let value = opts.initial;
 
  function render() {
    const pct = (value - opts.min) / (opts.max - opts.min);
    const trackWidth = track.offsetWidth;
    const half = handleWidth / 2;
 
    const center = half + pct * (trackWidth - handleWidth);
 
    opts.handle.style.left = (center - half) + 'px';
    opts.fill.style.width = center + 'px';
    opts.input.value = value;
    opts.input.value = opts.format ? opts.format(value) : value;
  }
 
  function clamp(v) {
    if (typeof v === 'string') v = parseFloat(v.replace(/,/g, ''));
    if (isNaN(v)) v = opts.min;
    v = Math.round(v / opts.step) * opts.step;
    return Math.min(opts.max, Math.max(opts.min, v));
  }
 
  function posToValue(clientX) {
    const rect = track.getBoundingClientRect();
    const half = handleWidth / 2;
    const usable = rect.width - handleWidth;
    const pct = (clientX - rect.left - half) / usable;
    return clamp(opts.min + pct * (opts.max - opts.min));
  }
 
  let dragging = false;
  let startX = 0;
  let moved = false;
 
  opts.handle.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    moved = false;
    opts.handle.style.cursor = 'grabbing';
    opts.handle.setPointerCapture(e.pointerId);
  });
 
  opts.handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - startX) > 3) moved = true;
    if (moved) {
      value = posToValue(e.clientX);
      render();
    }
  });
 
  opts.handle.addEventListener('pointerup', (e) => {
    dragging = false;
    opts.handle.style.cursor = 'grab';
 
    if (!moved) {
      const rect = opts.handle.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      if (e.clientX > center) {
        value = clamp(value + opts.step);
      } else {
        value = clamp(value - opts.step);
      }
      render();
    }
  });
 
  opts.input.addEventListener('change', () => {
    value = clamp(parseFloat(opts.input.value));
    render();
  });
 
  opts.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      value = clamp(parseFloat(opts.input.value));
      render();
      opts.input.blur();
    }
  });
 
  window.addEventListener('resize', render);
 
  render();
}
 
if (document.getElementById('age-handle')) {
    setupSlider({
        handle: document.getElementById('age-handle'),
        fill: document.getElementById('age-fill'),
        input: document.getElementById('age-input'),
        min: 55,
        max: 80,
        step: 1,
        initial: 58
    });
}

if (document.getElementById('price-handle')) {
    setupSlider({
        handle: document.getElementById('price-handle'),
        fill: document.getElementById('price-fill'),
        input: document.getElementById('price-input'),
        min: 5000,
        max: 120000,
        step: 500,
        initial: 27500
    });
}

document.querySelectorAll('.simulation_qna_list_area .list > li .cont .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const cont = btn.closest('.cont');
        const li = cont.closest('li');
        const allConts = li.closest('.list').querySelectorAll(':scope > li .cont');

        allConts.forEach((c) => {
            if (c === cont) return;
            c.classList.remove('active');
            c.querySelector('.btn').title = '닫힘'; 
            const inner = c.querySelector('.sim_content_info_cont');
            if (inner) {
                inner.style.height = inner.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    inner.style.height = '0';
                });
            }
        });

        const isActive = cont.classList.toggle('active');
        btn.title = isActive ? '펼침' : '닫힘'; 
        const inner = cont.querySelector('.sim_content_info_cont');

        if (isActive) {
            inner.style.height = inner.scrollHeight + 'px';
            inner.addEventListener('transitionend', () => {
                inner.style.height = 'auto';
            }, { once: true });
        } else {
            inner.style.height = inner.scrollHeight + 'px';
            requestAnimationFrame(() => {
                inner.style.height = '0';
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const notifCont = document.querySelector('.notification_sch_cont');

  if (notifCont) {
      const firstBox = notifCont.querySelector('.notification_sch_cont .box:first-child');
      const lastBox = notifCont.querySelector('.notification_sch_cont .box:last-child');
      const calendarBtn = firstBox.querySelector('.notification_sch_cont .calendar_btn');
      const closeBtn = lastBox.querySelector('.notification_sch_cont .close');

      calendarBtn.addEventListener('click', () => {
          firstBox.classList.add('hide');

          setTimeout(() => {
              lastBox.classList.add('active');
          }, 100);
      });

      closeBtn.addEventListener('click', () => {
          lastBox.classList.remove('active');

          setTimeout(() => {
              firstBox.classList.remove('hide');
          }, 100);
      });
  }
});

$(function () {
    function checkCardValid($accordion) {
        var allFilled = true;
        $accordion.find('input[required], select[required]').each(function () {
            if (!$(this).val()) { allFilled = false; return false; }
        });
        var $saveBtn = $accordion.find('.hf-card-save-btn');
        if (allFilled) { $saveBtn.removeClass('disabled').prop('disabled', false).addClass('active'); }
        else { $saveBtn.addClass('disabled').prop('disabled', true).removeClass('active'); }
    }

    $(document).on('click', '.hf-card-accordion .btn-accordion', function () {
        var $btn = $(this);
        var $collapse = $('#' + $btn.attr('aria-controls'));
        var $item = $btn.closest('.accordion-item');
        if ($collapse.hasClass('show')) {
            $collapse.removeClass('show');
            $item.addClass('is-closed');
        } else {
            $collapse.addClass('show');
            $item.removeClass('is-closed');
        }
    });

    $(document).on('click', '.hf-card-save-btn:not(:disabled)', function () {
        var $item = $(this).closest('.accordion-item');
        var $collapse = $item.find('.accordion-collapse');
        $collapse.removeClass('show');
        $item.addClass('is-closed');
        var $next = $item.next('.accordion-item');
        if ($next.length) {
            $next.removeClass('is-closed');
            $next.find('.accordion-collapse').addClass('show');
            $next.find('.btn-accordion').prop('disabled', false);
        }
        checkNextBtn();
    });

    function checkNextBtn() {
        var allSaved = true;
        $('.hf-card-accordion .accordion-item').each(function () {
            if (!$(this).hasClass('is-closed')) { allSaved = false; return false; }
        });
        $('.js-btn-next').prop('disabled', !allSaved);
    }

    $(document).on('click', '.hf-edit-btn', function () {
        location.href = $(this).data('href') || '#;';
    });

    $(document).on('click', '.hf-doc-upload-btn', function () {
        $(this).closest('.hf-doc-upload-zone').find('input[type="file"]').trigger('click');
    });
    $(document).on('click', '.hf-doc-upload-btn2', function () {
        $(this).closest('.hf-doc-upload-zone').find('input[type="file"]').trigger('click');
    });

    /* .com_pop_wrap.full .close 는 '공통 닫기 위임'이 처리한다.
       기존 핸들러는 active 만 즉시 떼서 닫힘 트랜지션과 스크롤 잠금 해제를 건너뛰었다. */
    $(document).on('click', '.js-pop-open', function () {
        var popId = $(this).data('pop');
        if (popId) { $('#' + popId).addClass('active'); }
    });
});

$(document).on('click', '.js-rate-toggle', function () {
    var $header = $(this);
    var targetId = $header.data('target');
    var $body = $('#' + targetId);
    var $btn = $header.find('.hf-rate-toggle-btn');
    var isOpen = $btn.attr('aria-expanded') === 'true';
    if (isOpen) {
        $body.addClass('is-hidden');
        $btn.attr('aria-expanded', 'false');
        $header.addClass('is-closed');
    } else {
        $body.removeClass('is-hidden');
        $btn.attr('aria-expanded', 'true');
        $header.removeClass('is-closed');
    }
});

function initStepScroll() {
  document.querySelectorAll('.step_list_cont').forEach(function (cont) {
    var scroller = cont.querySelector('.krds-step-wrap');
    if (!scroller) return;

    var items = scroller.querySelectorAll('li');
    if (items.length === 0) return;

    if (items.length <= 3) {
      cont.classList.add('active');
    } else {
      cont.classList.remove('active');
    }

    var active = scroller.querySelector('li.active');
    if (!active) return;

    var maxScroll = scroller.scrollWidth - scroller.clientWidth;
    if (maxScroll <= 0) return;

    var activeIndex = Array.prototype.indexOf.call(items, active);
    var target;

    if (activeIndex === 0) {
      target = 0;                                  
    } else if (activeIndex === items.length - 1) {
      target = maxScroll;                          
    } else {
      target = active.offsetLeft + active.offsetWidth / 2 - scroller.clientWidth / 2;
    }

    scroller.scrollLeft = Math.max(0, Math.min(target, maxScroll));
  });
}

window.addEventListener('load', initStepScroll);

var hf_esSubTab = {
    init: function () {
        var subtabs = document.querySelectorAll(".hf-es-subtab");
        if (!subtabs.length) return;

        subtabs.forEach(function (subtab) {
            var nav = subtab.querySelector(":scope > .hf-es-subtab-nav");
            var panelWrap = subtab.querySelector(":scope > .hf-es-subtab-panels");
            if (!nav) return;

            var btns = nav.querySelectorAll(":scope > .hf-es-subtab-btn");
            var panels = panelWrap
                ? panelWrap.querySelectorAll(":scope > .hf-es-subtab-panel")
                : [];

            btns.forEach(function (btn, idx) {
                if (btn.dataset.esSubtabBound === "true") return;
                btn.dataset.esSubtabBound = "true";

                btn.setAttribute("role", "tab");
                btn.setAttribute("aria-selected", btn.classList.contains("active") ? "true" : "false");

                btn.addEventListener("click", function () {
                    btns.forEach(function (b) {
                        b.classList.remove("active");
                        b.setAttribute("aria-selected", "false");
                    });
                    panels.forEach(function (p) {
                        p.classList.remove("active");
                    });

                    btn.classList.add("active");
                    btn.setAttribute("aria-selected", "true");
                    if (panels[idx]) panels[idx].classList.add("active");
                });
            });
        });
    }
};

(function () {
    function run() { hf_esSubTab.init(); }
    if (document.readyState !== "loading") {
        run();
    } else {
        document.addEventListener("DOMContentLoaded", run);
    }
    document.addEventListener("hf-include-done", run);
})();

document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('.hf-es-slider')) return;

  const esSwiper = new Swiper('.hf-es-slider', {
    loop: false,
    rewind: true,
    initialSlide: 0,
    slidesPerView: 1,
    spaceBetween: 8,

    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },

    navigation: {
      prevEl: '.hf-es-slide-area .swiper-prev-custom',
      nextEl: '.hf-es-slide-area .swiper-next-custom',
    },

    pagination: {
      el: '.hf-es-slide-area .swiper-pagination-custom',
      clickable: true,
      renderBullet: function (index, className) {
        return `<button type="button" class="${className}" aria-label="${index + 1}번 슬라이드로 이동"></button>`;
      },
    },
  });

});

document.addEventListener('DOMContentLoaded', function () {
  
    document.querySelectorAll('.hf-es-subtab').forEach(function (subtab) {
        var btns = subtab.querySelectorAll(':scope > .hf-es-subtab-nav > .hf-es-subtab-btn');
        var panels = subtab.querySelectorAll(':scope > .hf-es-subtab-panels > .hf-es-subtab-panel');
        btns.forEach(function (btn, i) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                panels.forEach(function (p) { p.classList.remove('active'); });
                btn.classList.add('active');
                if (panels[i]) panels[i].classList.add('active');
            });
        });
    });
});
 
document.querySelectorAll('.notification_list_cont .accordion-item').forEach(function (item) {
    // button 인 btn-accordion 만 대상 (div 는 제외)
    var btn = item.querySelector('button.btn-accordion');
    if (!btn) return;

    btn.addEventListener('click', function () {
        // 1. 클릭하면 user_chk 부여 (한 번이라도 클릭 시 유지)
        item.classList.add('user_chk');

        // 2 & 3. active 토글 + 형제 active 제거 (한 번에 하나만)
        var isActive = item.classList.contains('active');
        item.parentNode.querySelectorAll('.accordion-item.active').forEach(function (other) {
            other.classList.remove('active');
        });
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

document.addEventListener('hf-include-done', function () {
    if (document.querySelector('.view_content')) {
        var header = document.querySelector('header');
        if (header) header.classList.add('view');
    }
});

(function () {
    'use strict';

    var list = document.querySelector('.doc_progress_list');
    if (!list) return;

    function startIng(li) {
        if (!li) return; // 마지막까지 끝나면 종료

        if (li.classList.contains('done')) {
            startIng(li.nextElementSibling);
            return;
        }

        li.classList.remove('wait');
        li.classList.add('ing');

        var spinner = li.querySelector('.krds-spinner');
        if (!spinner) {
            finish(li);
            return;
        }

        spinner.style.animation = 'none';
        void spinner.offsetWidth; // 강제 리플로우
        spinner.style.animation = '';

        var handler = function (e) {
            if (e.animationName && e.animationName !== 'docGaugeFill') return;
            spinner.removeEventListener('animationend', handler);
            finish(li);
        };
        spinner.addEventListener('animationend', handler);
    }

    function finish(li) {
        li.classList.remove('ing');
        li.classList.add('done');
        startIng(li.nextElementSibling);
    }

    var start = list.querySelector('li.ing') || list.querySelector('li.wait');
    startIng(start);
})();


(function () {
    'use strict';

    document.querySelectorAll('.check_order_list.type_order').forEach(function (list) {
        var order = [];   // 선택된 input id 순서

        function refresh() {
            list.querySelectorAll('.check_order_chip input').forEach(function (input) {
                var chip = input.closest('.check_order_chip');
                var num = chip.querySelector('.chip_num');
                var idx = order.indexOf(input.id);
                if (idx > -1) {
                    num.setAttribute('data-order', idx + 1);   // 1부터
                } else {
                    num.removeAttribute('data-order');
                }
            });
        }

        list.querySelectorAll('.check_order_chip input').forEach(function (input) {
            input.addEventListener('change', function () {
                if (input.checked) {
                    if (order.indexOf(input.id) === -1) order.push(input.id);
                } else {
                    var i = order.indexOf(input.id);
                    if (i > -1) order.splice(i, 1);
                }
                refresh();
            });
        });

        var scope = list.closest('.pro_anagement_cont') || document;
        var resetBtn = scope.querySelector('.reset_btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                order = [];
                list.querySelectorAll('.check_order_chip input').forEach(function (input) {
                    input.checked = false;
                });
                refresh();
            });
        }
    });

    document.querySelectorAll('.check_order_list.type_check').forEach(function (list) {
        var scope = list.closest('.pro_anagement_cont') || document;
        var resetBtn = scope.querySelector('.reset_btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                list.querySelectorAll('.check_order_chip input').forEach(function (input) {
                    input.checked = false;
                });
            });
        }
    });
})();

document.addEventListener('DOMContentLoaded', function () {
    var slider = document.getElementById('worrySlider');
    if (!slider) return;
    var track = slider.querySelector('.track_bg');
    var fill = document.getElementById('worryFill');
    var handle = document.getElementById('worryHandle');
    var label = document.getElementById('worryScoreLabel');
    var STEP = 0.125;
    var value = 0.5;

    function scoreText(v) {
        if (v <= 0) return '올라도 상관없어요';
        if (v < 0.5) return '조금 신경 쓰여요(' + v + ')';
        if (v === 0.5) return '중간(0.5)';
        if (v < 1) return '꽤 걱정돼요(' + v + ')';
        return '오르면 정말 불안해요';
    }
    function render() {
        var pct = value * 100;
        fill.style.width = pct + '%';
        handle.setAttribute('aria-valuenow', value);
        if (label) label.textContent = scoreText(value);
    }
    function setFromClientX(clientX) {
        var rect = track.getBoundingClientRect();
        var ratio = (clientX - rect.left) / rect.width;
        ratio = Math.max(0, Math.min(1, ratio));
        value = Math.round(ratio / STEP) * STEP;
        value = Math.round(value * 1000) / 1000;
        render();
    }
    var dragging = false;
    function onDown(e) { dragging = true; slider.classList.add('is-active'); setFromClientX(e.touches ? e.touches[0].clientX : e.clientX); e.preventDefault(); }
    function onMove(e) { if (!dragging) return; setFromClientX(e.touches ? e.touches[0].clientX : e.clientX); e.preventDefault(); }
    function onUp() { dragging = false; slider.classList.remove('is-active'); }

    handle.addEventListener('mousedown', onDown);
    track.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    handle.addEventListener('touchstart', onDown, { passive: false });
    track.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    handle.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { value = Math.min(1, Math.round((value + STEP) * 1000) / 1000); render(); e.preventDefault(); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { value = Math.max(0, Math.round((value - STEP) * 1000) / 1000); render(); e.preventDefault(); }
    });
    render();
});



document.addEventListener('DOMContentLoaded', function () {
    if (typeof krds_disclosure !== 'undefined' && krds_disclosure.init) {
        krds_disclosure.init();
    }
});

const hf_inner_tab = {
    tabAreas: null,
    init() {
        this.tabAreas = document.querySelectorAll(".hf-inner-tab");
        if (!this.tabAreas.length) return;
        this.setupTabs();
    },
    setupTabs() {
        this.tabAreas.forEach((tabArea) => {
            const tabs = tabArea.querySelectorAll(".hf-tab-pill > li");

            tabs.forEach((tab) => {
                if (tab.dataset.listenerAttached) return;

                const control = tab.getAttribute("aria-controls");
                const panel = document.getElementById(control);
                if (!panel) return;

                tab.setAttribute("role", "tab");
                panel.setAttribute("role", "tabpanel");
                panel.setAttribute("aria-labelledby", tab.id || "");
                tab.setAttribute("aria-selected", tab.classList.contains("active") ? "true" : "false");

                tab.addEventListener("click", () => {
                    const closestTabs = tab.closest(".hf-tab-pill").querySelectorAll("li");
                    const closestPanels = tabArea.querySelectorAll(".hf-tab-pill-conts-wrap > .hf-tab-pill-conts");

                    this.resetTabs(closestTabs, closestPanels);

                    tab.classList.add("active");
                    tab.setAttribute("aria-selected", "true");
                    panel.classList.add("active");
                });

                this.setupKeyboardNavigation(tab);

                tab.dataset.listenerAttached = "true";
            });
        });
    },
    resetTabs(tabs, panels) {
        tabs.forEach((tab) => {
            tab.classList.remove("active");
            tab.setAttribute("aria-selected", "false");
        });
        panels.forEach((panel) => {
            panel.classList.remove("active");
        });
    },
    setupKeyboardNavigation(tab) {
        tab.addEventListener("keydown", function (event) {
            let newTab;
            if (event.key === "ArrowRight") {
                event.preventDefault();
                newTab = tab.nextElementSibling?.querySelector("button");
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                newTab = tab.previousElementSibling?.querySelector("button");
            }
            newTab?.focus();
        });
    },
};

document.addEventListener("DOMContentLoaded", () => {
    hf_inner_tab.init();
});

(function () {
    "use strict";

    var COLOR = {
        blue: "#4c87f6",
        navy: "#0d2a59",
        green: "#51b97a",
        orange: "#ffa33a",
        gray: "#e2e5e8"
    };

    var charts = {};

    function initPaymentChart() {
        var el = document.getElementById("chartPayment");
        if (!el || !window.Chart) return;
        charts.payment = new Chart(el, {
            type: "doughnut",
            data: {
                labels: ["종신지급방식", "종신혼합방식", "확정혼합방식", "기타"],
                datasets: [{
                    data: [60.43, 22.25, 9.65, 7.66],
                    backgroundColor: [COLOR.blue, COLOR.navy, COLOR.green, COLOR.gray],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: false,
                cutout: "62%",
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }

    function initTypeChart() {
        var el = document.getElementById("chartType");
        if (!el || !window.Chart) return;
        charts.type = new Chart(el, {
            type: "doughnut",
            data: {
                labels: ["정액형", "초기증액형(10년)", "전후후박형(폐지)", "초기증액형(7년)", "기타"],
                datasets: [{
                    data: [70.82, 14.01, 9.02, 2.52, 3.63],
                    backgroundColor: [COLOR.blue, COLOR.green, COLOR.navy, COLOR.orange, COLOR.gray],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: false,
                cutout: "62%",
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }

    var subscriberData = {
        period5: {
            labels: ["2020년", "2021년", "2022년", "2023년", "2024년"],
            data: [10859, 10172, 14580, 14346, 12388]
        },
        period10: {
            labels: ["2015년", "2017년", "2019년", "2021년", "2024년"],
            data: [6486, 10386, 10982, 10172, 12388]
        },
        periodAll: {
            labels: ["2006년", "2010년", "2015년", "2020년", "2024년"],
            data: [2936, 4380, 6486, 10859, 12388]
        }
    };

    function initSubscriberChart() {
        var el = document.getElementById("chartSubscriber");
        if (!el || !window.Chart) return;
        var init = subscriberData.period5;
        charts.subscriber = new Chart(el, {
            type: "line",
            data: {
                labels: init.labels,
                datasets: [{
                    data: init.data,
                    borderColor: COLOR.blue,
                    backgroundColor: COLOR.blue,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: COLOR.blue,
                    tension: 0,
                    fill: false
                }]
            },
            options: {
                responsive: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 15000,
                        ticks: { stepSize: 1000, color: "#8a949e", font: { size: 11 } },
                        grid: { color: "#e2e5e8" }
                    },
                    x: {
                        ticks: { color: "#1e2124", font: { size: 13 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function bindPeriodRadios() {
        var radios = document.querySelectorAll('input[name="period"]');
        radios.forEach(function (radio) {
            radio.addEventListener("change", function () {
                if (!charts.subscriber) return;
                var key = radio.id; // period5 / period10 / periodAll
                var d = subscriberData[key];
                if (!d) return;
                charts.subscriber.data.labels = d.labels;
                charts.subscriber.data.datasets[0].data = d.data;
                charts.subscriber.update();
            });
        });
    }

    function hasChart() {
        return document.getElementById("chartPayment") ||
            document.getElementById("chartType") ||
            document.getElementById("chartSubscriber");
    }

    function init() {
        if (!hasChart()) return;
        if (!window.Chart) return;
        initPaymentChart();
        initTypeChart();
        initSubscriberChart();
        bindPeriodRadios();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

(function () {
  function initApplyStatusSelect() {
      if (!document.querySelector('.apply_status_card')) return;
      var lists = document.querySelectorAll('.apply_status_list');
      for (var i = 0; i < lists.length; i++) {
          (function (list) {
              var checks = list.querySelectorAll('.apply_status_card input[type="checkbox"]');
              if (!checks.length) return;
              for (var j = 0; j < checks.length; j++) {
                  checks[j].addEventListener('change', function () {
                      var target = this;
                      var cards = list.querySelectorAll('.apply_status_card');
                      for (var k = 0; k < cards.length; k++) {
                          var card = cards[k];
                          var cb = card.querySelector('input[type="checkbox"]');
                          if (cb === target && target.checked) {
                              card.classList.add('active');
                          } else {
                              card.classList.remove('active');
                              if (cb) cb.checked = false;
                          }
                      }
                  });
              }
          })(lists[i]);
      }
  }
  if (document.readyState !== 'loading') {
      initApplyStatusSelect();
  } else {
      document.addEventListener('DOMContentLoaded', initApplyStatusSelect);
  }
})();

(function () {
  var CHART_DATA = [
    { x: 240, y: 138 }, { x: 180, y: 162 }, { x: 120, y: 187 },
    { x: 60, y: 219 }, { x: 0, y: 252 }
  ];
  var MARK = 2;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var tipPlugin = {
    id: 'schTip',
    afterDatasetsDraw: function (chart) {
      var meta = chart.getDatasetMeta(0);
      var pt = meta.data[MARK];
      if (!pt) return;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      ctx.save();
      var bw = 196, bh = 50, by = pt.y + 16;
      var bx = pt.x - 42;
      if (bx + bw > area.right) bx = area.right - bw;
      if (bx < area.left) bx = area.left;
      ctx.fillStyle = '#1e2124';
      ctx.beginPath();
      ctx.moveTo(pt.x, by - 8);
      ctx.lineTo(pt.x - 7, by);
      ctx.lineTo(pt.x + 7, by);
      ctx.closePath();
      ctx.fill();
      roundRect(ctx, bx, by, bw, bh, 8);
      ctx.fill();
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#c9ced4';
      ctx.font = "11px 'Pretendard GOV', 'Pretendard', sans-serif";
      ctx.fillText('납입 회차', bx + 14, by + 16);
      ctx.fillText('남은 대출 잔액', bx + 14, by + 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = "700 11px 'Pretendard GOV', 'Pretendard', sans-serif";
      ctx.fillText('120회차', bx + 106, by + 16);
      ctx.fillText('1억 6,500만원', bx + 106, by + 34);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4C87F6';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  };

  function makeChart(canvas) {
    return new Chart(canvas, {
      type: 'line',
      data: { datasets: [{ data: CHART_DATA, borderColor: '#4C87F6', borderWidth: 2, tension: 0.45, pointRadius: 0, fill: false }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 24, right: 6, bottom: 0, left: 0 } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            type: 'linear', reverse: true, min: 0, max: 240,
            grid: { display: false },
            border: { display: false },
            ticks: { stepSize: 40, color: '#464c53', font: { size: 11 }, padding: 8 }
          },
          y: {
            type: 'linear', min: 100, max: 252,
            afterBuildTicks: function (axis) {
              axis.ticks = [100, 120, 140, 160, 180, 200, 220, 240].map(function (v) { return { value: v }; });
            },
            grid: { color: '#e5e8eb', drawTicks: false },
            border: { display: false },
            ticks: { color: '#464c53', font: { size: 11 }, padding: 8, callback: function (v) { return v === 100 ? '0' : v; } }
          }
        }
      },
      plugins: [tipPlugin]
    });
  }

  function initView(view) {
    var toggle = view.querySelector('.sch_toggle');
    var tableWrap = view.querySelector('.sch_table_wrap');
    var chartWrap = view.querySelector('.sch_chart_wrap');
    if (!toggle || !tableWrap || !chartWrap) return;
    var chart = null;
    function ensureChart() {
      if (chart) return;
      var canvas = chartWrap.querySelector('canvas');
      if (canvas && window.Chart) chart = makeChart(canvas);
    }
    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('.sch_toggle_btn');
      if (!btn) return;
      toggle.querySelectorAll('.sch_toggle_btn').forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      var isChart = btn.getAttribute('data-view') === 'chart';
      tableWrap.hidden = isChart;
      chartWrap.hidden = !isChart;
      if (isChart) {
        ensureChart();
        if (chart) chart.resize();
      }
    });
  }

  function init() {
    document.querySelectorAll('.sch_view').forEach(initView);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
    function initRateChart() {
        var el = document.getElementById('rateChart');
        if (!el || typeof Chart === 'undefined') return;

        // ── 데이터/색상 (여기만 바꾸면 됨) ─────────────────────────
        var BLUE = '#4C87F6';   // 기본이자비용
        var NAVY = '#0D2A59';   // 금리상승걱정비용
        var BASE = [61, 51];    // 기본이자비용 (고정, 변동)
        var WORRY = [0, 5];     // 금리상승걱정비용 (고정, 변동)
        var totals = [61, 56];                    // 총액 말풍선 값
        var totalColors = ['#2B2E33', '#22B473']; // 고정=검정, 변동=초록
        // ────────────────────────────────────────────────────────

        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }
        function drawBubble(ctx, x, barTopY, text, color) {
            ctx.save();
            ctx.font = '700 12px "Pretendard GOV", sans-serif';
            var padX = 12, h = 26, triH = 5, lineH = 10, r = 13;
            var w = ctx.measureText(text).width + padX * 2;
            var bubbleBottom = barTopY - lineH - triH;
            var by = bubbleBottom - h, bx = x - w / 2;
            ctx.fillStyle = color;
            roundRect(ctx, bx, by, w, h, r); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 5, bubbleBottom); ctx.lineTo(x + 5, bubbleBottom); ctx.lineTo(x, bubbleBottom + triH);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = color; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x, bubbleBottom + triH); ctx.lineTo(x, barTopY - 3); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, barTopY, 5, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, x, by + h / 2);
            ctx.restore();
        }
        var labelPlugin = {
            id: 'rateLabels',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx;
                chart.data.datasets.forEach(function (ds, di) {
                    var meta = chart.getDatasetMeta(di);
                    meta.data.forEach(function (bar, i) {
                        var v = ds.data[i];
                        if (!v) return;
                        ctx.save();
                        ctx.fillStyle = '#fff';
                        ctx.font = '700 13px "Pretendard GOV", sans-serif';
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(v + '만원', bar.x, (bar.y + bar.base) / 2);
                        ctx.restore();
                    });
                });
                chart.getDatasetMeta(1).data.forEach(function (bar, i) {
                    var topY = bar.y;
                    chart.data.datasets.forEach(function (ds, di) {
                        var b = chart.getDatasetMeta(di).data[i];
                        if (ds.data[i] > 0 && b.y < topY) topY = b.y;
                    });
                    drawBubble(ctx, bar.x, topY, '총 ' + totals[i] + '만원', totalColors[i]);
                });
            }
        };
        new Chart(el, {
            type: 'bar',
            data: {
                labels: ['고정금리', '변동금리'],
                datasets: [
                    { label: '금리상승걱정비용', data: WORRY, backgroundColor: NAVY, stack: 's', barThickness: 64 },
                    { label: '기본이자비용', data: BASE, backgroundColor: BLUE, stack: 's', barThickness: 64, borderRadius: { topLeft: 6, topRight: 6 } }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 46 } },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        reverse: true, // 기본이자비용 먼저 노출
                        onClick: function () {}, // 클릭 토글 비활성(정적 범례)
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 24,
                            color: '#464C53',
                            font: { size: 13, weight: '500', family: '"Pretendard GOV", sans-serif' }
                        }
                    },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#464C53', font: { weight: '700', size: 13 } } },
                    y: { stacked: true, min: 0, max: 70, position: 'right', border: { display: false }, grid: { color: '#E5E8EB' }, ticks: { stepSize: 10, color: '#8D97A0', font: { size: 11 } } }
                }
            },
            plugins: [labelPlugin]
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRateChart);
    else initRateChart();
})();

function createWheelPicker(mount, options, value, onChange){
  if(!mount || !Array.isArray(options) || options.length === 0) return null; // 마운트/옵션 없으면 안전 종료(콘솔 에러 방지)
  let idx = options.indexOf(value);
  if(idx < 0){ idx = Math.min(options.length-1, Math.max(0, 2)); } // 비었으면 가운데쯤
  let selected = options[idx];

  const mask = document.createElement('div'); mask.className='wheel-mask';
  const band = document.createElement('div'); band.className='wheel-band'; band.setAttribute('aria-hidden','true');
  const list = document.createElement('div');
  list.className='wheel'; list.tabIndex=0;
  list.setAttribute('role','listbox');

  const padTop = document.createElement('div'); padTop.className='wheel-pad'; padTop.setAttribute('aria-hidden','true');
  const padBot = document.createElement('div'); padBot.className='wheel-pad'; padBot.setAttribute('aria-hidden','true');
  list.appendChild(padTop);

  const items=[];
  options.forEach((o,i)=>{
    const el=document.createElement('div');
    el.className='wheel-item'+(i===idx?' sel':'');
    el.textContent=o;
    el.id='wheel-'+i;
    el.setAttribute('role','option');
    el.setAttribute('aria-selected', i===idx?'true':'false');
    el.onclick=()=>select(i,true);
    list.appendChild(el);
    items.push(el);
  });
  list.appendChild(padBot);
  mask.appendChild(band);
  mask.appendChild(list);
  mount.appendChild(mask);

  const IH = () => (items[0] && items[0].offsetHeight) || 44;                        // 항목 1개 높이(측정)
  const posFor = i => padTop.offsetHeight + i*IH() + IH()/2 - list.clientHeight/2;   // i번을 중앙에 놓는 scrollTop
  const idxFromScroll = () => Math.round((list.scrollTop + list.clientHeight/2 - padTop.offsetHeight - IH()/2)/IH());
  let settleTimer=null, programmatic=false, ticking=false;

  function render(){
    const h=IH();
    const center=list.scrollTop + list.clientHeight/2;
    items.forEach((el,k)=>{
      const itemCenter=padTop.offsetHeight + k*h + h/2;
      const signed=(itemCenter-center)/h;                 // <0 위, >0 아래
      const dist=Math.abs(signed);
      const angle=Math.max(-72,Math.min(72, signed*30));
      const scale=Math.max(0.7, 1 - dist*0.10);
      const opacity=Math.max(0.22, 1 - dist*0.36);
      el.style.transform=`rotateX(${angle.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity=opacity.toFixed(3);
    });
  }
  function onScrollRender(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(()=>{ render(); ticking=false; });
  }
  function paint(i){
    items.forEach((el,k)=>{
      const on=k===i;
      el.classList.toggle('sel',on);
      el.setAttribute('aria-selected', on?'true':'false');
    });
    list.setAttribute('aria-activedescendant', items[i].id);
  }
  function select(i, scroll){
    i=Math.max(0,Math.min(items.length-1,i));
    idx=i; selected=options[i];
    paint(i);
    if(typeof onChange==='function') onChange(selected, i);
    if(scroll){
      programmatic=true; list.scrollTo({top:posFor(i),behavior:'smooth'});
      setTimeout(()=>{programmatic=false;render();},320);
    }
  }

  function onScroll(){
    onScrollRender();
    if(programmatic) return;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{
      const i=idxFromScroll();
      select(i,false);
      programmatic=true; list.scrollTo({top:posFor(i),behavior:'smooth'});
      setTimeout(()=>{programmatic=false;render();},320);
    },110);
  }
  function onKey(e){
    let handled=true;
    if(e.key==='ArrowDown'||e.key==='ArrowRight') select(idx+1,true);
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft') select(idx-1,true);
    else if(e.key==='Home') select(0,true);
    else if(e.key==='End') select(items.length-1,true);
    else if(e.key==='PageDown') select(idx+3,true);
    else if(e.key==='PageUp') select(idx-3,true);
    else handled=false;
    if(handled) e.preventDefault();
  }
  list.addEventListener('scroll', onScroll);
  list.addEventListener('keydown', onKey);

  requestAnimationFrame(()=>{ list.scrollTop=posFor(idx); render(); });
  setTimeout(()=>list.focus({preventScroll:true}),140);

  return {
    get value(){ return selected; },
    select,
    relayout(){ list.scrollTop=posFor(idx); render(); },   // 팝업이 보일 때 재정렬용(선택)
    destroy(){ list.removeEventListener('scroll',onScroll); list.removeEventListener('keydown',onKey); mount.removeChild(mask); }
  };
}

/* ===== 사용 예시 (해당 요소가 있을 때만 적용) ===== */
(function(){
  var mountEl = document.getElementById('mount');
  if(!mountEl) return;                 // #mount 없는 페이지에서는 실행 안 함 (콘솔 에러 방지)
  var YEARS=['2021 년','2022 년','2023 년','2024 년','2025 년'];
  var picked=document.getElementById('picked');
  var wheel=createWheelPicker(mountEl, YEARS, '', function(val){ if(picked) picked.textContent=val; });
  if(picked) picked.textContent=wheel.value;
})();

(function (d) {
  'use strict';

  function directPanel(item) {
    for (var i = 0; i < item.children.length; i++) {
      if (item.children[i].classList && item.children[i].classList.contains('hf-acc-panel')) return item.children[i];
    }
    return null;
  }

  function openItem(item) {
    if (item.classList.contains('on')) return;
    var p = directPanel(item);
    item.classList.add('on');
    if (!p) return;
    p.style.height = p.scrollHeight + 'px';
    var done = function () {
      if (item.classList.contains('on')) p.style.height = 'auto'; // 이후 중첩 변경 자동 반영
      p.removeEventListener('transitionend', done);
    };
    p.addEventListener('transitionend', done);
  }

  function closeItem(item) {
    if (!item.classList.contains('on')) return;
    var p = directPanel(item);
    if (p) {
      p.style.height = p.scrollHeight + 'px';       // auto → 고정값
      // 강제 리플로우 후 0 으로
      // eslint-disable-next-line no-unused-expressions
      p.offsetHeight;
      requestAnimationFrame(function () { p.style.height = '0px'; });
    }
    item.classList.remove('on');
  }

  function siblingsOf(acc, item) {
    var out = [];
    for (var i = 0; i < acc.children.length; i++) {
      var c = acc.children[i];
      if (c !== item && c.classList && c.classList.contains('hf-acc-item')) out.push(c);
    }
    return out;
  }

  d.addEventListener('click', function (e) {
    var head = e.target.closest ? e.target.closest('.hf-acc-head') : null;
    if (!head) return;
    var item = head.closest('.hf-acc-item');
    var acc = head.closest('[data-hf-acc]');
    if (!item || !acc) return;
    // 이 헤더가 "이 아코디언의 직속 아이템" 헤더일 때만 처리(중첩 오작동 방지)
    if (item.parentElement !== acc) return;

    var multi = acc.getAttribute('data-hf-acc') === 'multi';
    var willOpen = !item.classList.contains('on');

    if (!multi && willOpen) {
      siblingsOf(acc, item).forEach(closeItem);
    }
    if (willOpen) openItem(item); else closeItem(item);
  });

  // 초기 열림(on) 아이템의 패널 높이 auto 보정
  function initOpen(root) {
    var opened = (root || d).querySelectorAll('.hf-acc-item.on > .hf-acc-panel');
    Array.prototype.forEach.call(opened, function (p) { p.style.height = 'auto'; });
  }
  if (d.readyState !== 'loading') initOpen(d);
  else d.addEventListener('DOMContentLoaded', function () { initOpen(d); });

  // 동적 주입(팝업 등) 대응
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        for (var j = 0; j < muts[i].addedNodes.length; j++) {
          var n = muts[i].addedNodes[j];
          if (n.nodeType === 1) initOpen(n);
        }
      }
    }).observe(d.documentElement, { childList: true, subtree: true });
  }

  window.HFAccordion = { open: openItem, close: closeItem };
})(document);
