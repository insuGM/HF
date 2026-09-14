/**
 * KRDS Custom Scripts
 */

// 천단위 콤마 포맷팅 함수
function formatNumberWithCommas(value) {
  // 숫자가 아닌 문자 제거 (콤마 제외)
  const numValue = value.toString().replace(/[^\d]/g, '');
  // 천단위 콤마 추가
  return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 콤마 제거 함수
function removeCommas(value) {
  return value.toString().replace(/,/g, '');
}

// KRW 천단위 콤마 자동 추가
(function () {
  'use strict';

  function initKrwInputFormatting() {
    // krds-input와 krw 클래스가 모두 있는 input 요소 찾기
    const krwInputs = document.querySelectorAll('input.krds-input.krw, input.krw.krds-input');

    krwInputs.forEach(function (input) {
      // 이미 이벤트 리스너가 추가되었는지 확인
      if (input.dataset.krwFormatted === 'true') {
        return;
      }

      input.dataset.krwFormatted = 'true';

      // 포커스 인 시: 콤마 제거하여 편집하기 쉽게
      input.addEventListener('focus', function (e) {
        const value = e.target.value;
        if (value) {
          e.target.value = removeCommas(value);
        }
      });

      // 입력 시: 숫자만 허용하고 천단위 콤마 자동 추가
      input.addEventListener('input', function (e) {
        const value = e.target.value;
        // 숫자가 아닌 문자 제거 (콤마 제외)
        const numValue = value.replace(/[^\d]/g, '');

        if (numValue) {
          // 천단위 콤마 추가
          e.target.value = formatNumberWithCommas(numValue);
        } else {
          e.target.value = '';
        }
      });

      // 포커스 아웃 시: 천단위 콤마 추가
      input.addEventListener('blur', function (e) {
        const value = e.target.value;
        if (value) {
          const numValue = removeCommas(value);
          if (numValue) {
            e.target.value = formatNumberWithCommas(numValue);
          }
        }
      });

      // 키보드 이벤트: 숫자만 입력 허용
      input.addEventListener('keypress', function (e) {
        // 숫자, 백스페이스, 삭제, 탭, 화살표 키만 허용
        const char = String.fromCharCode(e.which || e.keyCode);
        if (!/[0-9]/.test(char) && !/[Backspace|Delete|Tab|ArrowLeft|ArrowRight]/.test(e.key)) {
          e.preventDefault();
        }
      });

      // 붙여넣기 이벤트: 숫자만 추출하여 포맷팅
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const numValue = pastedText.replace(/[^\d]/g, '');
        if (numValue) {
          input.value = formatNumberWithCommas(numValue);
          // input 이벤트 트리거
          input.dispatchEvent(new Event('input'));
        }
      });
    });
  }

  // DOMContentLoaded 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initKrwInputFormatting, 100);
    });
  } else {
    setTimeout(initKrwInputFormatting, 100);
  }

  // 동적으로 추가된 요소를 위해 MutationObserver 사용
  if (window.MutationObserver) {
    const observer = new MutationObserver(function (mutations) {
      initKrwInputFormatting();
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }
})();

// 스크롤 방향 감지 및 #wrap에 scroll-up/scroll-down 클래스 추가
(function () {
  'use strict';

  function initScrollDirection() {
    const wrap = document.getElementById('wrap');
    if (!wrap) {
      setTimeout(initScrollDirection, 100);
      return;
    }

    // 컨테이너 요소 찾기 (#container 또는 #app 또는 .container)
    const container =
      document.querySelector('#container') || document.querySelector('#app') || document.querySelector('.container');

    let threshold = 0;
    function updateThreshold() {
      const containerOffsetTop = container ? container.offsetTop : 0;
      threshold = containerOffsetTop + 50; // 헤더 높이 고려
    }
    updateThreshold();

    let lastScrollY = window.scrollY || window.pageYOffset;
    let ticking = false;

    function updateScrollDirection() {
      const currentScrollY = window.scrollY || window.pageYOffset;
      const isScrollingDown = currentScrollY > lastScrollY;
      const isScrollingUp = currentScrollY < lastScrollY;
      const isPastThreshold = currentScrollY > threshold;

      if (isPastThreshold) {
        if (isScrollingDown) {
          wrap.classList.add('scroll-down');
          wrap.classList.remove('scroll-up');
        } else if (isScrollingUp) {
          wrap.classList.add('scroll-up');
          wrap.classList.remove('scroll-down');
        }
      } else {
        // threshold 이전에는 클래스 제거
        wrap.classList.remove('scroll-down', 'scroll-up');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    }

    // 초기 실행
    updateScrollDirection();

    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', onScroll, { passive: true });

    // 리사이즈 이벤트도 감지 (컨테이너 위치 변경 대응)
    window.addEventListener(
      'resize',
      function () {
        updateThreshold();
        updateScrollDirection();
      },
      { passive: true }
    );
  }

  // DOMContentLoaded 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initScrollDirection, 100);
    });
  } else {
    setTimeout(initScrollDirection, 100);
  }
})();

// Skip-link 클릭 시 스크롤 없이 포커스만 이동
(function () {
  'use strict';

  function initSkipLink() {
    const skipLink = document.querySelector('#krds-skip-link a');
    if (!skipLink) {
      setTimeout(initSkipLink, 100);
      return;
    }

    skipLink.addEventListener('click', function (e) {
      e.preventDefault();

      // breadcrumb 내부의 .home 클래스를 가진 li의 첫 번째 a 태그 찾기
      const breadcrumb = document.querySelector('#breadcrumb');
      if (breadcrumb) {
        const homeLink = breadcrumb.querySelector('.home a, li.home a');
        if (homeLink) {
          // 포커스 이동
          homeLink.focus();

          // 일정 시간 후 outline 제거
          setTimeout(function () {
            homeLink.style.outline = '';
            homeLink.style.outlineOffset = '';
          }, 2000);
        }
      }
    });
  }

  // DOMContentLoaded 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initSkipLink, 100);
    });
  } else {
    setTimeout(initSkipLink, 100);
  }
})();

// Sidemenu activeMenu 기반 메뉴 활성화 (단순화)
(function () {
  'use strict';

  function initSidemenuActive() {
    const sidemenuContainer = document.querySelector('.side-menu-wrap, .krds-side-navigation');
    if (!sidemenuContainer) {
      setTimeout(initSidemenuActive, 100);
      return;
    }

    // data-active-menu 속성에서 텍스트 가져오기
    // side-menu-wrap에서 먼저 찾기
    const sideMenuWrap = document.querySelector('.side-menu-wrap');
    let activeMenuText = null;

    if (sideMenuWrap) {
      activeMenuText = sideMenuWrap.getAttribute('data-active-menu');
    }

    // side-menu-wrap에서 못 찾으면 sidemenu 컨테이너 내부에서 찾기
    if (!activeMenuText) {
      const elementInContainer = sidemenuContainer.querySelector('[data-active-menu]');
      if (elementInContainer) {
        activeMenuText = elementInContainer.getAttribute('data-active-menu');
      }
    }

    // 전체 문서에서 찾기
    if (!activeMenuText) {
      const elementWithDataAttr = document.querySelector('[data-active-menu]');
      if (elementWithDataAttr) {
        activeMenuText = elementWithDataAttr.getAttribute('data-active-menu');
      }
    }

    if (!activeMenuText) {
      return;
    }

    // 모든 lnb-btn 중에서 텍스트가 정확히 일치하는 것 찾기
    const allLnbBtns = sidemenuContainer.querySelectorAll('.lnb-btn');
    let targetBtn = null;

    for (let i = 0; i < allLnbBtns.length; i++) {
      const btn = allLnbBtns[i];
      const btnText = btn.textContent.trim();
      if (btnText === activeMenuText) {
        targetBtn = btn;
        break;
      }
    }

    if (!targetBtn) {
      return;
    }

    // selected 클래스 추가
    targetBtn.classList.add('selected');

    // 상위 lnb-submenu-lv2 확인
    const lnbSubmenuLv2 = targetBtn.closest('.lnb-submenu-lv2');

    if (lnbSubmenuLv2) {
      // lnb-submenu-lv2가 있는 경우
      lnbSubmenuLv2.classList.add('active');

      // 상위 버튼들에 aria-expanded="true" 설정
      const lnbBtnTit = lnbSubmenuLv2.querySelector('.lnb-btn-tit');
      if (lnbBtnTit) {
        lnbBtnTit.setAttribute('aria-expanded', 'true');
      }

      const lnbSubitem = targetBtn.closest('.lnb-subitem');
      if (lnbSubitem) {
        const togglePopupBtn = lnbSubitem.querySelector('.lnb-toggle-popup');
        if (togglePopupBtn) {
          togglePopupBtn.setAttribute('aria-expanded', 'true');
        }
      }
    } else {
      // lnb-submenu-lv2가 없는 경우
      // 상위 버튼들에 aria-expanded="true" 설정
      const lnbSubitem = targetBtn.closest('.lnb-subitem');
      if (lnbSubitem) {
        const togglePopupBtn = lnbSubitem.querySelector('.lnb-toggle-popup');
        if (togglePopupBtn) {
          togglePopupBtn.setAttribute('aria-expanded', 'true');
        }
      }
    }

    // 상위 lnb-item에 active 클래스 추가
    const lnbItem = targetBtn.closest('.lnb-item');
    if (lnbItem) {
      lnbItem.classList.add('active');

      // 부모 메뉴 열기
      const parentToggle = lnbItem.querySelector('.lnb-toggle');
      if (parentToggle) {
        const submenu = lnbItem.querySelector('.lnb-submenu');
        if (submenu) {
          submenu.style.display = 'block';
          lnbItem.classList.add('is-open');
        }
      }
    }
  }

  // DOMContentLoaded 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initSidemenuActive, 200);
    });
  } else {
    setTimeout(initSidemenuActive, 200);
  }
})();

// lnb-btn-tit 클릭 시 토글 기능 (이벤트 위임 사용)
(function () {
  'use strict';

  function initLnbBtnTitToggle() {
    const sidemenuContainer = document.querySelector('.side-menu-wrap, .krds-side-navigation');
    if (!sidemenuContainer) {
      setTimeout(initLnbBtnTitToggle, 100);
      return;
    }

    // 이벤트 위임: sidemenuContainer에 한 번만 이벤트 리스너 추가
    if (sidemenuContainer.dataset.toggleInitialized === 'true') {
      return;
    }

    sidemenuContainer.dataset.toggleInitialized = 'true';

    // 캡처 단계에서 이벤트 처리 (다른 핸들러보다 먼저 실행)
    sidemenuContainer.addEventListener(
      'click',
      function (e) {
        // lnb-btn-tit 클릭인지 확인
        const btnTit = e.target.closest('.lnb-btn-tit');
        if (!btnTit) {
          return;
        }

        // 다른 이벤트 핸들러가 실행되지 않도록 즉시 중지
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const lnbSubmenuLv2 = btnTit.closest('.lnb-submenu-lv2');
        if (!lnbSubmenuLv2) {
          return;
        }

        // 현재 상태 확인
        const isActive = lnbSubmenuLv2.classList.contains('active');
        const currentAriaExpanded = btnTit.getAttribute('aria-expanded');

        // 토글 실행
        if (isActive || currentAriaExpanded === 'true') {
          // 닫기
          lnbSubmenuLv2.classList.remove('active');
          btnTit.setAttribute('aria-expanded', 'false');
        } else {
          // 열기
          lnbSubmenuLv2.classList.add('active');
          btnTit.setAttribute('aria-expanded', 'true');
        }
      },
      true
    ); // 캡처 단계에서 처리
  }

  // DOMContentLoaded 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initLnbBtnTitToggle, 200);
    });
  } else {
    setTimeout(initLnbBtnTitToggle, 200);
  }
})();

// select 커스텀 box
document.addEventListener('DOMContentLoaded', () => {
  const selectBoxes = document.querySelectorAll('.krds_select_box');

  selectBoxes.forEach((selectBox, index) => {
    // 1. 고유 ID 설정 (기존 ID가 없으면 'krds-sel-0' 형태로 자동 생성)
    if (!selectBox.id) {
      selectBox.id = `krds-sel-${index}`;
    }
    const uniqueId = selectBox.id;

    const triggerBtn = selectBox.querySelector('.select_tit button');
    const listContainer = selectBox.querySelector('.select_list');
    const listUl = listContainer.querySelector('ul');
    const options = listUl.querySelectorAll('button');
    const listId = `list-${uniqueId}`;

    // 2. ARIA 속성 자동 주입
    triggerBtn.setAttribute('aria-haspopup', 'listbox');
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.setAttribute('aria-controls', listId);

    listUl.setAttribute('role', 'listbox');
    listUl.id = listId;

    // 초기 선택 상태 설정: triggerBtn 텍스트와 일치하는 옵션 찾기
    const triggerText = triggerBtn.innerText.trim();
    let initialSelectedIndex = -1;

    const wrapText = (btn) => {
      if (!btn || btn.querySelector('.opt_txt')) return;
      const span = document.createElement('span');
      span.className = 'opt_txt';
      while (btn.firstChild) {
        span.appendChild(btn.firstChild);
      }
      btn.appendChild(span);
      const titleText = span.textContent.trim();
      if (titleText) {
        btn.setAttribute('title', titleText);
      }
    };

    wrapText(triggerBtn);

    options.forEach((btn, optIndex) => {
      wrapText(btn);
      btn.setAttribute('role', 'option');
      const optionText = btn.innerText.trim();

      // 텍스트가 일치하면 selected 클래스 추가 (completed는 추가하지 않음)
      if (triggerText === optionText && initialSelectedIndex === -1) {
        btn.setAttribute('aria-selected', 'true');
        btn.classList.add('selected');
        initialSelectedIndex = optIndex;
      } else {
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // 3. 열기/닫기 로직
    const toggleSelect = (forceClose = false) => {
      const isExpanded = triggerBtn.getAttribute('aria-expanded') === 'true';
      const nextState = forceClose ? false : !isExpanded;

      triggerBtn.setAttribute('aria-expanded', nextState);
      listContainer.style.display = nextState ? 'block' : 'none';
    };

    // 4. 이벤트 바인딩
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      toggleSelect();
    });

    options.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const selectedText = e.currentTarget.textContent.trim();

        // 메인 버튼 텍스트 업데이트
        let triggerTextNode = triggerBtn.querySelector('.opt_txt');
        if (!triggerTextNode) {
          wrapText(triggerBtn);
          triggerTextNode = triggerBtn.querySelector('.opt_txt');
        }
        if (triggerTextNode) {
          triggerTextNode.textContent = selectedText;
          if (selectedText) {
            triggerBtn.setAttribute('title', selectedText);
          }
        }

        // 상태 업데이트 및 닫기
        options.forEach((b) => {
          b.setAttribute('aria-selected', 'false');
          b.classList.remove('selected');
        });
        e.currentTarget.setAttribute('aria-selected', 'true');
        e.currentTarget.classList.add('selected');

        // 사용자가 선택했을 때 completed 클래스 추가
        selectBox.classList.add('completed');

        toggleSelect(true); // 닫기
        triggerBtn.focus();
      });
    });

    // 5. 외부 클릭 시 현재 열린 셀렉트 박스만 닫기
    document.addEventListener('click', (e) => {
      if (!selectBox.contains(e.target)) {
        toggleSelect(true);
      }
    });
  });
});

// 아코디언
document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.acc_item');
  const slideDurationMs = 400;
  const fadeDurationMs = 200;

  faqItems.forEach((item, index) => {
    const question = item.querySelector('.acc_hd');
    const answer = item.querySelector('.acc_desc');

    if (!question || !answer) return;

    answer.style.overflow = 'hidden';
    answer.style.willChange = 'height, opacity';

    // 자동으로 aria-controls와 id 설정
    const answerId = `faq_answer_${index + 1}`;
    question.setAttribute('aria-controls', answerId);
    answer.setAttribute('id', answerId);

    // hidden 속성 자동 설정 (없으면 기본적으로 닫힌 상태)
    if (!answer.hasAttribute('hidden')) {
      answer.setAttribute('hidden', '');
    }

    // hidden 상태에 맞게 aria-expanded 설정
    const isHidden = answer.hasAttribute('hidden');
    question.setAttribute('aria-expanded', isHidden ? 'false' : 'true');

    if (isHidden) {
      answer.style.height = '0px';
      answer.style.opacity = '0';
    } else {
      answer.style.height = 'auto';
      answer.style.opacity = '1';
    }

    const openAnswer = () => {
      if (answer._accordionAnim) {
        answer._accordionAnim.cancel();
      }
      answer.removeAttribute('hidden');
      answer.style.height = '0px';
      answer.style.opacity = '0';
      const targetHeight = answer.scrollHeight;
      answer._accordionAnim = answer.animate(
        [
          { height: '0px', opacity: 0 },
          { height: `${targetHeight}px`, opacity: 1 },
        ],
        { duration: slideDurationMs, easing: 'ease', fill: 'forwards' }
      );
      answer._accordionAnim.onfinish = () => {
        answer.style.height = 'auto';
        answer.style.opacity = '1';
        answer._accordionAnim = null;
      };
    };

    const closeAnswer = () => {
      if (answer._accordionAnim) {
        answer._accordionAnim.cancel();
      }
      const currentHeight = answer.getBoundingClientRect().height;
      answer._accordionAnim = answer.animate(
        [
          { height: `${currentHeight}px`, opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        { duration: slideDurationMs, easing: 'ease', fill: 'forwards' }
      );
      answer._accordionAnim.onfinish = () => {
        answer.setAttribute('hidden', '');
        answer.style.height = '0px';
        answer.style.opacity = '0';
        answer._accordionAnim = null;
      };
    };

    question.addEventListener('click', () => {
      const isExpanded = question.getAttribute('aria-expanded') === 'true';

      // 클릭한 항목만 토글
      if (isExpanded) {
        question.setAttribute('aria-expanded', 'false');
        closeAnswer();
      } else {
        question.setAttribute('aria-expanded', 'true');
        openAnswer();
      }
    });
  });
});

// 프로필 상세: btn_dtl_info → dl.open 토글 + dd 슬라이드 (모바일 .type_fold 등)
document.addEventListener('DOMContentLoaded', function () {
  const slideMs = 350;
  const profileDtlMobileMq = window.matchMedia('(max-width: 767px)');

  function cancelProfileDtlAnimation(dd) {
    if (dd._profileDtlAnim) {
      dd._profileDtlAnim.cancel();
      dd._profileDtlAnim = null;
    }
    if (dd.getAnimations) {
      dd.getAnimations().forEach(function (anim) {
        anim.cancel();
      });
    }
  }

  function setProfileDtlButtonState(btn, expanded) {
    btn.classList.toggle('up', expanded);
    btn.classList.toggle('down', !expanded);
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function openProfileDtl(dl, dd, btn) {
    cancelProfileDtlAnimation(dd);
    setProfileDtlButtonState(btn, true);
    dl.classList.add('open');

    const wasHidden = dd.hidden;
    dd.hidden = false;
    dd.style.display = 'block';
    dd.style.overflow = 'hidden';

    const startH = wasHidden ? 0 : dd.getBoundingClientRect().height;
    dd.style.height = startH + 'px';
    const targetH = dd.scrollHeight;

    dd._profileDtlAnim = dd.animate(
      [{ height: startH + 'px' }, { height: targetH + 'px' }],
      { duration: slideMs, easing: 'ease', fill: 'forwards' }
    );
    dd._profileDtlAnim.onfinish = function () {
      dd.style.height = 'auto';
      dd.style.overflow = '';
      dd.style.display = '';
      dd._profileDtlAnim = null;
    };
  }

  function closeProfileDtl(dl, dd, btn) {
    cancelProfileDtlAnimation(dd);
    setProfileDtlButtonState(btn, false);

    dd.hidden = false;
    dd.style.display = 'block';
    dd.style.overflow = 'hidden';

    const startH = dd.getBoundingClientRect().height || dd.scrollHeight;
    dd.style.height = startH + 'px';
    void dd.offsetHeight;

    dd._profileDtlAnim = dd.animate(
      [{ height: startH + 'px' }, { height: '0px' }],
      { duration: slideMs, easing: 'ease', fill: 'forwards' }
    );
    dd._profileDtlAnim.onfinish = function () {
      dl.classList.remove('open');
      dd.hidden = true;
      dd.style.height = '';
      dd.style.overflow = '';
      dd.style.display = '';
      dd._profileDtlAnim = null;
    };
  }

  function resetProfileDtlFoldForWideViewport() {
    document.querySelectorAll('.btn_dtl_info').forEach(function (btn) {
      var dl = btn.closest('dl');
      if (!dl) return;
      var dd = dl.querySelector(':scope > dd');
      if (!dd) return;

      cancelProfileDtlAnimation(dd);
      dd.hidden = false;
      dd.style.height = '';
      dd.style.overflow = '';
      dd.style.display = '';
      dl.classList.remove('open');
      setProfileDtlButtonState(btn, false);
    });
  }

  function initProfileDtlFoldForMobile() {
    document.querySelectorAll('.btn_dtl_info').forEach(function (btn) {
      var dl = btn.closest('dl');
      if (!dl) return;
      var dd = dl.querySelector(':scope > dd');
      if (!dd) return;

      cancelProfileDtlAnimation(dd);
      var expanded = btn.classList.contains('up') || dl.classList.contains('open');
      setProfileDtlButtonState(btn, expanded);
      dl.classList.toggle('open', expanded);
      dd.hidden = !expanded;
      dd.style.height = '';
      dd.style.overflow = '';
      dd.style.display = '';
    });
  }

  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn_dtl_info');
    if (!btn) return;

    if (!profileDtlMobileMq.matches) return;

    const dl = btn.closest('dl');
    if (!dl) return;

    const dd = dl.querySelector(':scope > dd');
    if (!dd) return;

    e.preventDefault();

    const isExpanded = btn.getAttribute('aria-expanded') === 'true' || btn.classList.contains('up');

    if (isExpanded) {
      closeProfileDtl(dl, dd, btn);
    } else {
      openProfileDtl(dl, dd, btn);
    }
  });

  if (profileDtlMobileMq.matches) {
    initProfileDtlFoldForMobile();
  } else {
    resetProfileDtlFoldForWideViewport();
  }

  // 모바일 → PC 전환 시 dd에 남은 인라인 높이/애니메이션 잔여 제거 (_mixin.scss $tablet 과 동일)
  function onProfileDtlViewportChange() {
    if (profileDtlMobileMq.matches) {
      initProfileDtlFoldForMobile();
    } else {
      resetProfileDtlFoldForWideViewport();
    }
  }
  if (profileDtlMobileMq.addEventListener) {
    profileDtlMobileMq.addEventListener('change', onProfileDtlViewportChange);
  } else if (profileDtlMobileMq.addListener) {
    profileDtlMobileMq.addListener(onProfileDtlViewportChange);
  }
});

// 파일 업로드 컴포넌트
document.addEventListener('DOMContentLoaded', () => {
  const fileUploadContainers = document.querySelectorAll('.krds-file-upload');

  fileUploadContainers.forEach((container) => {
    // 설정 (data 속성으로 오버라이드 가능)
    const maxFilesAttr = Number.parseInt(container.dataset.maxFiles, 10);
    const maxSizeMbAttr = Number.parseFloat(container.dataset.maxSizeMb);
    const maxFiles = Number.isFinite(maxFilesAttr) && maxFilesAttr > 0 ? maxFilesAttr : 10;
    const maxSizeMb = Number.isFinite(maxSizeMbAttr) && maxSizeMbAttr > 0 ? maxSizeMbAttr : 20;
    const maxFileSize = Math.round(maxSizeMb * 1024 * 1024);

    const config = {
      maxFileSize,
      maxFiles,
      maxSizeMb,
      completeDisplayMs: 1000,
      allowedExtensions: [], // 빈 배열이면 모든 파일 허용
    };

    // DOM 요소
    const fileUploadArea = container.querySelector('.file-upload');
    const fileInput = container.querySelector('input[type="file"]');
    const fileList = container.querySelector('.file-list');
    const uploadList = container.querySelector('.upload-list');
    const totalCount = container.querySelector('.total .current');
    const maxCount = container.querySelector('.total');
    const clearAllBtn = container.querySelector('.upload-delete-btn button');

    // 파일 저장소
    const files = new Map(); // fileId -> fileData
    let fileIdCounter = 0;

    // 파일 크기 포맷팅
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
    }

    // 파일 확장자 추출
    function getFileExtension(filename) {
      return filename.split('.').pop().toLowerCase();
    }

    // 파일 검증
    function validateFile(file, currentFilesCount) {
      const errors = [];

      // 크기 검증
      if (file.size > config.maxFileSize) {
        errors.push({
          type: 'size',
          message: `등록 가능한 파일 용량을 초과하였습니다.\n${config.maxSizeMb}MB 미만의 파일만 등록할 수 있습니다.`,
        });
      }

      // 확장자 검증 (설정된 경우)
      if (config.allowedExtensions.length > 0) {
        const ext = getFileExtension(file.name);
        if (!config.allowedExtensions.includes(ext)) {
          errors.push({
            type: 'extension',
            message: `허용되지 않은 파일 형식입니다.\n${config.allowedExtensions.join(
              ', '
            )} 파일만 업로드할 수 있습니다.`,
          });
        }
      }

      // 중복 검사
      for (const [id, fileData] of files.entries()) {
        if (fileData.file.name === file.name && fileData.file.size === file.size) {
          errors.push({
            type: 'duplicate',
            message: '이미 추가된 파일입니다.',
          });
          break;
        }
      }

      // 최대 파일 개수 검사 (현재 파일 개수 기준)
      if (currentFilesCount >= config.maxFiles) {
        errors.push({
          type: 'maxFiles',
          message: `최대 ${config.maxFiles}개까지 업로드할 수 있습니다.`,
        });
      }

      return {
        valid: errors.length === 0,
        errors: errors,
      };
    }

    const imageExtensions = new Set(['webp', 'avif', 'svg', 'png', 'jpg', 'jpeg', 'gif']);

    // 파일 정보 텍스트 생성
    function getFileInfoText(file) {
      const ext = getFileExtension(file.name);
      const size = formatFileSize(file.size);
      return `${file.name} [${ext}, ${size}]`;
    }

    // 리스트 아이템 생성
    function createFileListItem(fileData) {
      const li = document.createElement('li');
      const file = fileData.file;
      const fileInfoText = getFileInfoText(file);
      const fileExt = getFileExtension(file.name);
      const isImageFile = imageExtensions.has(fileExt);

      li.setAttribute('data-file-id', fileData.id);

      if (fileData.status === 'error') {
        li.classList.add('is-error');
      }

      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';

      const fileName = document.createElement('div');
      fileName.className = 'file-name';
      fileName.textContent = fileInfoText;

      const btnWrap = document.createElement('div');
      btnWrap.className = 'btn-wrap';

      // 상태에 따른 버튼/아이콘
      if (fileData.status === 'uploading') {
        const spinner = document.createElement('span');
        spinner.className = 'krds-spinner';
        spinner.setAttribute('role', 'status');
        const srOnly = document.createElement('span');
        srOnly.className = 'sr-only';
        srOnly.textContent = '업로드 중';
        spinner.appendChild(srOnly);
        btnWrap.appendChild(spinner);
      } else if (fileData.status === 'complete') {
        const completeIcon = document.createElement('span');
        completeIcon.className = 'ico-invalid complete';
        const srOnly = document.createElement('em');
        srOnly.className = 'sr-only';
        srOnly.textContent = '업로드 완료';
        completeIcon.appendChild(srOnly);
        btnWrap.appendChild(completeIcon);
      } else {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'krds-btn medium text';
        deleteBtn.innerHTML = '삭제 <i class="svg-icon ico-delete-fill"></i>';
        deleteBtn.addEventListener('click', () => removeFile(fileData.id));
        btnWrap.appendChild(deleteBtn);
      }

      fileInfo.appendChild(fileName);
      fileInfo.appendChild(btnWrap);
      li.appendChild(fileInfo);

      // 이미지 파일인 경우 대체텍스트 입력 영역 추가
      if (isImageFile && fileData.status !== 'error') {
        const altId = `file_alt_${fileData.id}`;
        const altBox = document.createElement('div');
        altBox.className = 'file_alt_box';
        altBox.innerHTML = [
          '<dl>',
          '  <dt><label for="' + altId + '">이미지 대체 텍스트</label></dt>',
          '  <dd><input type="text" name="' +
            altId +
            '" id="' +
            altId +
            '" class="krds-input small" placeholder="내용을 입력하세요."/></dd>',
          '</dl>',
        ].join('');
        li.appendChild(altBox);
      }

      // 에러 메시지
      if (fileData.status === 'error' && fileData.errorMessage) {
        const errorHint = document.createElement('p');
        errorHint.className = 'file-hint-invalid';
        errorHint.innerHTML = fileData.errorMessage.replace(/\n/g, '<br>');
        li.appendChild(errorHint);
      }

      return li;
    }

    // 파일 추가
    function addFile(file) {
      // 현재 파일 개수를 기준으로 검증 (추가 전 개수)
      const currentFilesCount = files.size;
      const validation = validateFile(file, currentFilesCount);

      const fileData = {
        id: ++fileIdCounter,
        file: file,
        status: validation.valid ? 'uploading' : 'error',
        errorMessage: validation.valid ? null : validation.errors[0].message,
      };

      // 유효한 파일이거나 에러가 있어도 리스트에 추가 (에러도 표시하기 위해)
      files.set(fileData.id, fileData);

      // 리스트에 추가
      const listItem = createFileListItem(fileData);
      uploadList.appendChild(listItem);

      // 파일 개수 업데이트
      updateFileCount();

      // 유효한 파일이면 업로드 시뮬레이션
      if (validation.valid) {
        // 실제 업로드 로직은 여기에 추가
        // 현재는 시뮬레이션으로 2초 후 완료 처리
        setTimeout(() => {
          fileData.status = 'complete';
          updateFileStatus(fileData.id, 'complete');
          // 완료 표시 후 삭제 버튼으로 전환
          setTimeout(() => {
            const current = files.get(fileData.id);
            if (!current || current.status !== 'complete') return;
            updateFileStatus(fileData.id, 'ready');
          }, config.completeDisplayMs);
        }, 2000);
      }
    }

    // 파일 상태 업데이트
    function updateFileStatus(fileId, status) {
      const fileData = files.get(fileId);
      if (!fileData) return;

      fileData.status = status;

      const listItem = uploadList.querySelector(`[data-file-id="${fileId}"]`);
      if (!listItem) return;

      // 기존 아이템 제거하고 새로 생성
      const newItem = createFileListItem(fileData);
      listItem.replaceWith(newItem);
    }

    // 파일 삭제
    function removeFile(fileId) {
      const listItem = uploadList.querySelector(`[data-file-id="${fileId}"]`);
      if (listItem) {
        listItem.remove();
      }
      files.delete(fileId);
      updateFileCount();
    }

    // 전체 파일 삭제
    function clearAllFiles() {
      if (files.size === 0) return;

      if (confirm('모든 파일을 삭제하시겠습니까?')) {
        files.clear();
        uploadList.innerHTML = '';
        updateFileCount();
      }
    }

    // 파일 개수 업데이트
    function updateFileCount() {
      const currentCount = files.size;
      if (totalCount) {
        totalCount.textContent = `${currentCount}개`;
      }
      if (maxCount) {
        maxCount.innerHTML = `<span>첨부 파일<span class="current">${currentCount}개</span> / ${config.maxFiles}개</span><button type="button" class="btn_file_del">전체 파일 삭제<i class="svg-icon ico-angle right" aria-hidden="true"></i></button>`;
      }

      // 파일 리스트 영역 표시/숨김
      if (fileList) {
        if (currentCount > 0) {
          fileList.style.display = 'flex';
        } else {
          fileList.style.display = 'none';
        }
      }
    }

    // 파일 선택 처리
    function handleFileSelect(selectedFiles) {
      const fileArray = Array.from(selectedFiles);

      // 각 파일을 독립적으로 처리 (에러가 있어도 다른 파일은 추가됨)
      fileArray.forEach((file) => {
        // 최대 파일 개수 체크 (현재 파일 수 기준)
        if (files.size >= config.maxFiles) {
          // 최대 개수 초과 시 알림만 표시하고 추가하지 않음
          alert(`최대 ${config.maxFiles}개까지 업로드할 수 있습니다.`);
          return;
        }
        addFile(file);
      });
    }

    // 파일 입력 이벤트
    if (fileInput) {
      // 다중 파일 선택 허용
      fileInput.setAttribute('multiple', 'multiple');

      // change 이벤트 중복 방지를 위한 플래그
      let isProcessing = false;

      fileInput.addEventListener('change', (e) => {
        // 이미 처리 중이면 무시
        if (isProcessing) {
          return;
        }

        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
          isProcessing = true;

          // 파일 처리
          handleFileSelect(selectedFiles);

          // 다음 파일 선택을 위해 초기화 (약간의 지연 후)
          setTimeout(() => {
            e.target.value = '';
            isProcessing = false;
          }, 100);
        } else {
          isProcessing = false;
        }
      });
    }

    // 파일 선택 버튼 클릭 이벤트 (krds.js 중복 호출 방지)
    const fileSelectButton = fileUploadArea ? fileUploadArea.querySelector('button') : null;
    if (fileSelectButton && fileInput) {
      fileSelectButton.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          fileInput.click();
        },
        true
      );
    }

    // 드래그 앤 드롭 이벤트
    if (fileUploadArea) {
      // dragover
      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.add('active');
      });

      // dragleave
      fileUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.remove('active');
      });

      // drop
      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileUploadArea.classList.remove('active');

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
          handleFileSelect(droppedFiles);
        }
      });
    }

    // 전체 삭제 버튼
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', clearAllFiles);
    }

    // 초기 파일 리스트 숨김
    if (fileList && files.size === 0) {
      fileList.style.display = 'none';
    }
  });
});

// 모바일에서만 bd_tit 자동 삽입 (krds_board_list)
document.addEventListener('DOMContentLoaded', () => {
  const mq = window.matchMedia('(max-width: 767px)');
  const selector = '.krds_board_list [data-text]';

  const applyMobileTitles = () => {
    const targets = document.querySelectorAll(selector);
    targets.forEach((target) => {
      const text = target.getAttribute('data-text');
      if (!text) return;

      const existing = target.querySelector(':scope > .bd_tit');
      if (mq.matches) {
        if (!existing) {
          const span = document.createElement('span');
          span.className = 'bd_tit';
          span.textContent = text;
          target.insertBefore(span, target.firstChild);
        }
      } else if (existing) {
        existing.remove();
      }
    });
  };

  applyMobileTitles();
  mq.addEventListener('change', applyMobileTitles);
  window.addEventListener('resize', applyMobileTitles);
});

// 공통 팝업 열기/닫기 기능 (접근성 포함)
(function () {
  'use strict';

  /**
   * 팝업에 접근성 속성 자동 추가
   * @param {HTMLElement} popup - 팝업 요소
   */
  function initPopupAccessibility(popup) {
    if (!popup || !popup.id) return;

    const popupId = popup.id;

    // 팝업에 접근성 속성 추가
    if (!popup.hasAttribute('role')) {
      popup.setAttribute('role', 'dialog');
    }
    if (!popup.hasAttribute('aria-modal')) {
      popup.setAttribute('aria-modal', 'true');
    }
    if (!popup.hasAttribute('aria-hidden')) {
      popup.setAttribute('aria-hidden', 'true');
    }

    // 제목 요소 찾기 및 aria-labelledby 설정
    const titleElement = popup.querySelector('.pop_head h2, .pop_head h3, .pop_head .title, [class*="title"]');
    if (titleElement) {
      const titleId = popupId + '_title';
      if (!titleElement.id) {
        titleElement.id = titleId;
      }
      if (!popup.hasAttribute('aria-labelledby')) {
        popup.setAttribute('aria-labelledby', titleElement.id);
      }
    }

    // 트리거 버튼에 접근성 속성 추가
    const trigger = document.querySelector(`[data-target="${popupId}"]`);
    if (trigger) {
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', 'false');
      }
      if (!trigger.hasAttribute('aria-controls')) {
        trigger.setAttribute('aria-controls', popupId);
      }
      // aria-label이 없으면 텍스트 내용이나 기본값 사용
      if (!trigger.hasAttribute('aria-label')) {
        const triggerText = trigger.textContent.trim() || trigger.querySelector('.txt')?.textContent.trim();
        if (triggerText) {
          trigger.setAttribute('aria-label', triggerText);
        }
      }
    }

    // 닫기 버튼에 접근성 속성 추가
    const closeBtn = popup.querySelector('.btn_close, [data-close-target="' + popupId + '"]');
    if (closeBtn && !closeBtn.hasAttribute('aria-label')) {
      closeBtn.setAttribute('aria-label', '팝업 닫기');
    }

    // dimmed에 접근성 속성 추가
    const dimmed = popup.querySelector('.dimmed');
    if (dimmed && !dimmed.hasAttribute('aria-label')) {
      dimmed.setAttribute('aria-label', '팝업 닫기');
    }
  }

  /**
   * 모든 팝업 초기화
   */
  function initAllPopups() {
    const popups = document.querySelectorAll('.pop_set');
    popups.forEach(function (popup) {
      initPopupAccessibility(popup);
    });
  }

  /**
   * 팝업 열기
   * @param {HTMLElement} trigger - 팝업을 열 트리거 요소
   * @param {HTMLElement} popup - 열릴 팝업 요소
   */
  function openPopup(trigger, popup) {
    if (!popup) return;

    // 접근성 속성이 없으면 추가
    initPopupAccessibility(popup);

    // 팝업 표시
    popup.classList.add('active');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // footer 팝업(pop_family_site, pop_quick_link)이면 footer z-index 조정
    var popupId = popup.id;
    if (popupId === 'pop_family_site' || popupId === 'pop_quick_link') {
      var footer = document.querySelector('.hfh_footer');
      if (footer) {
        footer.style.zIndex = '70';
      }
    }

    // 트리거 버튼 상태 업데이트
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    // pop_wrap에 포커스 설정 (tabindex 추가 후 포커스)
    const popWrap = popup.querySelector('.pop_wrap');
    if (popWrap) {
      // tabindex가 없으면 추가 (포커스 가능하도록)
      if (!popWrap.hasAttribute('tabindex')) {
        popWrap.setAttribute('tabindex', '-1');
      }
      setTimeout(() => {
        popWrap.focus();
      }, 100);
    } else {
      // pop_wrap이 없으면 첫 번째 포커스 가능한 요소로 포커스 이동
      const firstFocusable = popup.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        setTimeout(() => {
          firstFocusable.focus();
        }, 100);
      }
    }
  }

  /**
   * 팝업 닫기
   * @param {HTMLElement} trigger - 팝업을 닫을 트리거 요소 (선택적)
   * @param {HTMLElement} popup - 닫을 팝업 요소
   */
  function closePopup(trigger, popup) {
    if (!popup) return;

    // 팝업 숨김
    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // footer 팝업(pop_family_site, pop_quick_link)이면 footer z-index 원래대로
    var popupId = popup.id;
    if (popupId === 'pop_family_site' || popupId === 'pop_quick_link') {
      var footer = document.querySelector('.hfh_footer');
      if (footer) {
        footer.style.zIndex = '';
      }
    }

    // 트리거 버튼 상태 업데이트
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      // 포커스 복귀
      setTimeout(() => {
        if (trigger && document.body.contains(trigger)) {
          trigger.focus();
        }
      }, 100);
    }
  }

  /**
   * ESC 키 핸들러 (전역)
   */
  function handleGlobalEscape(e) {
    if (e.key !== 'Escape') return;

    const activePopup = document.querySelector('.pop_set.active');
    if (activePopup) {
      const targetId = activePopup.id;
      const trigger = document.querySelector(`[data-target="${targetId}"]`);
      closePopup(trigger, activePopup);
    }
  }

  /**
   * 팝업 내 포커스 갇힘 (Tab 시 팝업 밖으로 나가지 않도록)
   * @param {KeyboardEvent} e
   */
  function handlePopupFocusTrap(e) {
    if (e.key !== 'Tab') return;

    var activePopup = document.querySelector('.pop_set.active');
    if (!activePopup) return;

    // 포커스가 팝업 밖에 있으면 트랩하지 않음
    if (!activePopup.contains(document.activeElement)) return;

    var focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var focusable = Array.prototype.filter.call(activePopup.querySelectorAll(focusableSelector), function (el) {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.hasAttribute('hidden');
    });

    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var currentIndex = focusable.indexOf(document.activeElement);

    if (e.shiftKey) {
      // Shift+Tab: 첫 번째에 있거나 포커스가 목록 밖(pop_wrap 등)이면 마지막으로
      if (currentIndex <= 0) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: 마지막에 있거나 포커스가 목록 밖이면 첫 번째로
      if (currentIndex === -1 || currentIndex === focusable.length - 1) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // DOMContentLoaded 시 모든 팝업 초기화 및 MutationObserver 설정
  function initPopupSystem() {
    initAllPopups();

    // 동적으로 추가된 팝업을 위한 MutationObserver
    if (document.body && window.MutationObserver) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1 && node.classList && node.classList.contains('pop_set')) {
              initPopupAccessibility(node);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * URL 쿼리 파라미터(?open=팝업아이디)로 팝업/모달 자동 오픈
   * 예) participation_clean_corruption_info.html?open=modal_identify
   */
  function initOpenTargetFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var targetId = params.get('open');
    if (!targetId) return;

    var opened = false;

    function tryOpen() {
      if (opened) return true;

      var target = document.getElementById(targetId);
      if (!target) return false;

      // custom 팝업(.pop_set)
      if (target.classList.contains('pop_set')) {
        var trigger = document.querySelector('[data-target="' + targetId + '"]:not(.open-modal)');
        openPopup(trigger, target);
        opened = true;
        return true;
      }

      // KRDS 모달(.krds-modal): 기존 open-modal 트리거 클릭으로 오픈
      if (target.classList.contains('krds-modal')) {
        var modalTrigger = document.querySelector('.open-modal[data-target="' + targetId + '"]');
        if (modalTrigger) {
          modalTrigger.click();
          opened = true;
          return true;
        }

        // 트리거가 없는 경우 fallback 오픈
        var dialogElement = target.querySelector('.modal-content');
        var modalBack = target.querySelector('.modal-back');
        if (!dialogElement || !modalBack) return false;

        document.body.classList.add('scroll-no');
        dialogElement.removeAttribute('tabindex');
        target.setAttribute('role', 'dialog');
        target.classList.add('shown');
        modalBack.classList.add('in');
        setTimeout(function () {
          target.classList.add('in');
        }, 150);

        opened = true;
        return true;
      }

      return false;
    }

    // include.js 등 비동기 렌더링 대응: 잠시 재시도
    var attempts = 0;
    var maxAttempts = 30;
    var retryTimer = setInterval(function () {
      attempts += 1;
      if (tryOpen() || attempts >= maxAttempts) {
        clearInterval(retryTimer);
      }
    }, 150);

    // 초기 1회 즉시 시도
    tryOpen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initPopupSystem();
      initOpenTargetFromQuery();
    });
  } else {
    initPopupSystem();
    initOpenTargetFromQuery();
  }

  // 전역 ESC 키 리스너 등록
  document.addEventListener('keydown', handleGlobalEscape);

  // 팝업 열려 있을 때 Tab 포커스 갇힘 (팝업 밖으로 나가지 않도록)
  document.addEventListener('keydown', handlePopupFocusTrap, true);

  // 팝업 열기: data-target 속성을 가진 요소 클릭 시 (krds 모달과 충돌 방지: .open-modal 클래스가 없는 경우만 처리)
  document.addEventListener(
    'click',
    function (e) {
      const trigger = e.target.closest('[data-target]');
      if (!trigger || !trigger.hasAttribute('data-target')) return;

      // krds 모달과 충돌 방지: .open-modal 클래스가 있으면 krds.js가 처리하도록 함
      if (trigger.classList.contains('open-modal')) return;

      const targetId = trigger.getAttribute('data-target');
      const popup = document.getElementById(targetId);

      // .pop_set 클래스를 가진 팝업만 처리
      if (popup && popup.classList.contains('pop_set')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // 다른 이벤트 리스너 실행 방지

        // 새로 팝업을 열기 전에 이미 열려있는 다른 팝업 닫기
        const activePopups = document.querySelectorAll('.pop_set.active');
        activePopups.forEach(function (activePopup) {
          if (activePopup.id !== targetId) {
            const activeTrigger = document.querySelector(`[data-target="${activePopup.id}"]`);
            closePopup(activeTrigger, activePopup);
          }
        });

        openPopup(trigger, popup);
      }
    },
    true
  ); // capturing phase로 변경하여 다른 이벤트보다 먼저 처리

  // 팝업 닫기: data-close-target 속성을 가진 요소 클릭 시
  document.addEventListener(
    'click',
    function (e) {
      const closeBtn = e.target.closest('[data-close-target]');
      if (!closeBtn || !closeBtn.hasAttribute('data-close-target')) return;

      const targetId = closeBtn.getAttribute('data-close-target');
      const popup = document.getElementById(targetId);

      if (popup && popup.classList.contains('pop_set')) {
        e.preventDefault();
        e.stopPropagation();

        // 트리거 버튼 찾기
        const trigger = document.querySelector(`[data-target="${targetId}"]`);
        closePopup(trigger, popup);
      }
    },
    true
  ); // capturing phase로 변경

  // dimmed 영역 클릭 시 닫기
  document.addEventListener(
    'click',
    function (e) {
      if (e.target.classList.contains('dimmed')) {
        const popup = e.target.closest('.pop_set');
        if (popup) {
          const targetId = popup.id;
          const trigger = document.querySelector(`[data-target="${targetId}"]`);
          closePopup(trigger, popup);
        }
      }
    },
    true
  ); // capturing phase로 변경
})();

/* vh 변수 */
function setVh() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', setVh);
setVh();

// datepicker 입력 포맷 (숫자만, YYYY.MM.DD 자동 포맷)
(function () {
  'use strict';

  function formatDateValue(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 4) {
      return digits;
    }
    if (digits.length <= 6) {
      return `${digits.slice(0, 4)}.${digits.slice(4)}`;
    }
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
  }

  function handleDateInput(e) {
    const input = e.target;
    const formatted = formatDateValue(input.value);
    input.value = formatted;
  }

  function initDatepickerInputs(scope) {
    const inputs = (scope || document).querySelectorAll('input.krds-input.datepicker');
    inputs.forEach((input) => {
      if (input.dataset.datepickerFormatted === 'true') return;
      input.dataset.datepickerFormatted = 'true';
      // readonly로 막힌 경우 입력 가능하도록 해제
      input.removeAttribute('readonly');
      input.readOnly = false;
      input.inputMode = 'numeric';
      input.addEventListener('focus', () => {
        input.removeAttribute('readonly');
        input.readOnly = false;
      });
      input.addEventListener('input', handleDateInput);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initDatepickerInputs(document));
  } else {
    initDatepickerInputs(document);
  }

  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('input.krds-input.datepicker')) {
            initDatepickerInputs(node.parentElement || document);
          } else if (node.querySelectorAll) {
            initDatepickerInputs(node);
          }
        });
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
})();

// number 입력 maxlength 적용 (krds-input)
(function () {
  'use strict';

  function applyMaxlength(input) {
    const maxAttr = input.getAttribute('maxlength');
    const max = Number.parseInt(maxAttr, 10);
    if (!Number.isFinite(max) || max <= 0) return;

    const raw = input.value || '';
    const trimmed = raw.slice(0, max);
    if (raw !== trimmed) {
      input.value = trimmed;
    }
  }

  function bindNumberMaxlength(input) {
    if (input.dataset.numberMaxlength === 'true') return;
    input.dataset.numberMaxlength = 'true';
    input.addEventListener('input', (e) => applyMaxlength(e.target));
    input.addEventListener('paste', (e) => {
      setTimeout(() => applyMaxlength(e.target), 0);
    });
  }

  function initNumberMaxlength(scope) {
    const inputs = (scope || document).querySelectorAll('input.krds-input[type="number"][maxlength]');
    inputs.forEach((input) => bindNumberMaxlength(input));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initNumberMaxlength(document));
  } else {
    initNumberMaxlength(document);
  }

  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('input.krds-input[type="number"][maxlength]')) {
            bindNumberMaxlength(node);
          } else if (node.querySelectorAll) {
            initNumberMaxlength(node);
          }
        });
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
})();

// 탭 영역 접근성/구조 자동 설정
(function () {
  'use strict';

  function ensureTabArrows(tabArea) {
    const tabWrap = tabArea.querySelector('.tab.fill.full');
    if (!tabWrap) return;

    const tabList = tabWrap.querySelector('ul');
    if (!tabList) return;

    const existingLeft = tabWrap.querySelector('.tab_arrow_left');
    const existingRight = tabWrap.querySelector('.tab_arrow_right');

    if (!existingLeft) {
      const leftWrap = document.createElement('div');
      leftWrap.className = 'tab_arrow_left';
      leftWrap.innerHTML = [
        '<button type="button" class="krds-btn large icon border scroll_btn_left">',
        '    <span class="sr-only">탭 왼쪽 스크롤</span>',
        '    <i class="svg-icon ico-angle left"></i>',
        '</button>',
      ].join('');
      tabWrap.appendChild(leftWrap);
    }

    if (!existingRight) {
      const rightWrap = document.createElement('div');
      rightWrap.className = 'tab_arrow_right';
      rightWrap.innerHTML = [
        '<button type="button" class="krds-btn large icon border scroll_btn_right">',
        '    <span class="sr-only">탭 오른쪽 스크롤</span>',
        '    <i class="svg-icon ico-angle right"></i>',
        '</button>',
      ].join('');
      tabWrap.appendChild(rightWrap);
    }
  }

  function updateTabAria(tabArea) {
    const tabList = tabArea.querySelector('.tab.fill.full ul');
    if (!tabList) return;

    if (!tabList.hasAttribute('role')) {
      tabList.setAttribute('role', 'tablist');
    }

    const tabs = Array.from(tabList.querySelectorAll('li'));
    if (tabs.length === 0) return;

    const panels = Array.from(tabArea.querySelectorAll('.tab-conts-wrap .tab-conts'));
    let baseId = tabArea.id;
    if (!baseId) {
      const allAreas = Array.from(document.querySelectorAll('.krds-tab-area'));
      const areaIndex = allAreas.indexOf(tabArea);
      const safeIndex = areaIndex >= 0 ? areaIndex + 1 : 1;
      baseId = `krds-tab-${safeIndex}`;
      tabArea.id = baseId;
    }
    const isPageTab = tabArea.classList.contains('tab_page');
    const useSinglePanel = isPageTab && panels.length === 1;
    let singlePanel = useSinglePanel ? panels[0] : null;
    if (singlePanel && !singlePanel.id) {
      singlePanel.id = `${baseId}_panel_01`;
    }

    let activeIndex = tabs.findIndex((tab) => tab.classList.contains('active'));
    if (activeIndex < 0) {
      activeIndex = 0;
      tabs[0].classList.add('active');
    }

    tabs.forEach((tab, index) => {
      if (!tab.hasAttribute('role')) {
        tab.setAttribute('role', 'presentation');
      }

      const tabBtn = tab.querySelector('button, a, .btn-tab');
      if (!tabBtn) return;

      if (tabBtn.tagName === 'BUTTON' && !tabBtn.hasAttribute('type')) {
        tabBtn.setAttribute('type', 'button');
      }

      if (!tabBtn.id) {
        tabBtn.id = `${baseId}_tab_${String(index + 1).padStart(2, '0')}`;
      }

      if (!tabBtn.hasAttribute('role')) {
        tabBtn.setAttribute('role', 'tab');
      }

      let panel = null;
      if (!useSinglePanel) {
        panel = panels[index] || null;
        if (panel && !panel.id) {
          panel.id = `${baseId}_panel_${String(index + 1).padStart(2, '0')}`;
        }
      } else {
        panel = singlePanel;
      }

      const isActive = index === activeIndex || tab.classList.contains('active');
      tabBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');

      if (panel) {
        if (useSinglePanel) {
          if (isActive) {
            tabBtn.setAttribute('aria-controls', panel.id);
            panel.setAttribute('aria-labelledby', tabBtn.id);
          } else {
            tabBtn.removeAttribute('aria-controls');
          }
        } else {
          const panelId = tabBtn.getAttribute('aria-controls') || panel.id;
          if (panelId) {
            tabBtn.setAttribute('aria-controls', panelId);
          }
          panel.setAttribute('aria-labelledby', tabBtn.id);
        }
      }

      const created = tabBtn.querySelector('.sr-only.created');
      if (isActive) {
        if (!created) {
          const srOnly = document.createElement('i');
          srOnly.className = 'sr-only created';
          srOnly.textContent = ' 선택됨';
          tabBtn.appendChild(srOnly);
        }
      } else if (created) {
        created.remove();
      }

      if (panel) {
        if (!panel.hasAttribute('data-quick-nav')) {
          panel.setAttribute('data-quick-nav', 'true');
        }
        if (isActive) {
          panel.classList.add('active');
        }
      }
    });
  }

  function bindTabInteractions(tabArea) {
    const tabList = tabArea.querySelector('.tab.fill.full ul');
    if (!tabList || tabList.dataset.tabA11yBound === 'true') return;
    tabList.dataset.tabA11yBound = 'true';

    if (tabArea.classList.contains('tab_page')) {
      return;
    }

    tabList.addEventListener('click', (e) => {
      const tabTrigger = e.target.closest('button[role="tab"], a[role="tab"]');
      if (!tabTrigger || !tabList.contains(tabTrigger)) return;

      if (tabTrigger.tagName === 'A') {
        e.preventDefault();
      }

      const tabItems = Array.from(tabList.querySelectorAll('li'));
      const triggers = tabItems.map((item) => item.querySelector('button[role="tab"], a[role="tab"]')).filter(Boolean);
      const panels = Array.from(tabArea.querySelectorAll('.tab-conts-wrap .tab-conts'));
      const index = triggers.indexOf(tabTrigger);

      triggers.forEach((btn, idx) => {
        const isActive = idx === index;
        const item = tabItems[idx];
        if (item) {
          item.classList.toggle('active', isActive);
        }
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

        const created = btn.querySelector('.sr-only.created');
        if (isActive) {
          if (!created) {
            const srOnly = document.createElement('i');
            srOnly.className = 'sr-only created';
            srOnly.textContent = ' 선택됨';
            btn.appendChild(srOnly);
          }
        } else if (created) {
          created.remove();
        }
      });

      panels.forEach((panel, idx) => {
        if (idx === index) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  }

  function initTabAccessibility(scope) {
    const areas = (scope || document).querySelectorAll('.krds-tab-area');
    areas.forEach((tabArea) => {
      ensureTabArrows(tabArea);
      updateTabAria(tabArea);
      bindTabInteractions(tabArea);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTabAccessibility(document));
  } else {
    initTabAccessibility(document);
  }

  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('.krds-tab-area')) {
            initTabAccessibility(node);
          } else if (node.querySelectorAll) {
            const areas = node.querySelectorAll('.krds-tab-area');
            if (areas.length > 0) {
              initTabAccessibility(node);
            }
          }
        });
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
})();

// 탭 스크롤 버튼 기능
(function () {
  'use strict';

  function initTabScrollButton() {
    const tabAreas = document.querySelectorAll('.krds-tab-area.layer .tab.fill.full');

    tabAreas.forEach((tabArea) => {
      const tabList = tabArea.querySelector('ul[role="tablist"]');
      const wrapperLeft = tabArea.querySelector('.tab_arrow_left');
      const wrapperRight = tabArea.querySelector('.tab_arrow_right');
      const scrollBtnLeft = tabArea.querySelector('.scroll_btn_left');
      const scrollBtnRight = tabArea.querySelector('.scroll_btn_right');

      if (!tabList || !wrapperLeft || !wrapperRight || !scrollBtnLeft || !scrollBtnRight) return;

      // 스크롤 가능 여부 체크 및 버튼/wrapper 표시/숨김
      function checkScrollable() {
        const isScrollable = tabList.scrollWidth > tabList.clientWidth;
        const scrollLeft = tabList.scrollLeft;
        const scrollRight = scrollLeft + tabList.clientWidth;
        const scrollWidth = tabList.scrollWidth;

        const isAtStart = scrollLeft <= 1;
        const isAtEnd = scrollRight >= scrollWidth - 1;

        if (isScrollable) {
          // 좌측 wrapper: 시작 위치가 아니면 표시
          if (isAtStart) {
            wrapperLeft.classList.remove('is_visible');
          } else {
            wrapperLeft.classList.add('is_visible');
          }
          // 우측 wrapper: 끝 위치가 아니면 표시
          if (isAtEnd) {
            wrapperRight.classList.remove('is_visible');
          } else {
            wrapperRight.classList.add('is_visible');
          }
        } else {
          // 스크롤 불가능하면 둘 다 숨김
          wrapperLeft.classList.remove('is_visible');
          wrapperRight.classList.remove('is_visible');
        }
      }

      // 좌측 버튼 클릭 시 왼쪽으로 스크롤
      scrollBtnLeft.addEventListener('click', function () {
        const scrollAmount = tabList.clientWidth * 0.8; // 화면 너비의 80%만큼 스크롤
        tabList.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth',
        });
      });

      // 우측 버튼 클릭 시 오른쪽으로 스크롤
      scrollBtnRight.addEventListener('click', function () {
        const scrollAmount = tabList.clientWidth * 0.8; // 화면 너비의 80%만큼 스크롤
        tabList.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      });

      // 스크롤 이벤트로 버튼 표시/숨김 업데이트
      tabList.addEventListener('scroll', function () {
        checkScrollable();
      });

      // 초기 체크
      checkScrollable();

      // 리사이즈 이벤트 처리
      let resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          checkScrollable();
        }, 100);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabScrollButton);
  } else {
    initTabScrollButton();
  }

  // 동적으로 추가된 탭 영역도 처리
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('.krds-tab-area.layer')) {
            initTabScrollButton();
          } else if (node.querySelectorAll) {
            const tabAreas = node.querySelectorAll('.krds-tab-area.layer');
            if (tabAreas.length > 0) {
              initTabScrollButton();
            }
          }
        });
      });
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
})();

// krds-table-wrap 접근성 추가
(function () {
  'use strict';

  function setTableAccessibility() {
    const tables = document.querySelectorAll('.krds-table-wrap table');

    tables.forEach((table) => {
      // scope 속성 자동 추가
      table.querySelectorAll('thead th').forEach((th) => {
        if (!th.hasAttribute('scope')) th.setAttribute('scope', 'col');
      });

      table.querySelectorAll('tbody th').forEach((th) => {
        if (!th.hasAttribute('scope')) th.setAttribute('scope', 'row');
      });

      // data-title, th을 이용한 caption 자동 생성
      const capTitle = table.getAttribute('data-title');
      if (capTitle) {
        const existingCaption = table.querySelector('caption');
        if (existingCaption) {
          existingCaption.remove();
        }

        const theadThs = table.querySelectorAll('thead th');
        const columnTitles = Array.from(theadThs)
          .map((th) => th.textContent.trim())
          .filter((text) => text);

        let captionText = '';
        if (columnTitles.length > 0) {
          const columnsText = columnTitles.join(', ');
          captionText = `${capTitle}에 대한 표로 ${columnsText}에 대한 내용으로 구성되어 있습니다.`;
        } else {
          captionText = `${capTitle}에 대한 표입니다.`;
        }

        const caption = document.createElement('caption');
        caption.textContent = captionText;
        table.insertBefore(caption, table.firstChild);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setTableAccessibility, 100);
    });
  } else {
    setTimeout(setTableAccessibility, 100);
  }
})();

// krds-table-wrap 정렬 처리
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tbl.data').forEach((table) => {
    const cols = table.querySelectorAll('colgroup col');
    if (!cols.length) return;

    const alignMap = Array.from(cols).map((col) => col.dataset.align || 'center');

    const rows = table.querySelectorAll('tbody tr');
    const matrix = [];

    rows.forEach((tr, rowIndex) => {
      if (!matrix[rowIndex]) matrix[rowIndex] = [];
      let visualColIdx = 0;

      Array.from(tr.children).forEach((cell) => {
        while (matrix[rowIndex][visualColIdx]) {
          visualColIdx++;
        }

        const align = alignMap[visualColIdx];
        if (align && align !== 'center') {
          cell.classList.add(`ta_${align}`);
        }

        const rs = cell.rowSpan || 1;
        const cs = cell.colSpan || 1;

        for (let r = 0; r < rs; r++) {
          for (let c = 0; c < cs; c++) {
            const targetRow = rowIndex + r;
            if (!matrix[targetRow]) matrix[targetRow] = [];
            matrix[targetRow][visualColIdx + c] = true;
          }
        }

        visualColIdx += cs;
      });
    });
  });
});

// krds_board_list 체크박스 접근성 레이블 연결
(function () {
  'use strict';

  var globalCounter = 0;

  function setBoardCheckboxAccessibility() {
    var boardLists = document.querySelectorAll('.krds_board_list');
    if (!boardLists.length) return;

    boardLists.forEach(function (boardList) {
      var checkboxCells = boardList.querySelectorAll('.checkbox_cell .krds-form-check');

      checkboxCells.forEach(function (checkboxWrap) {
        var checkboxInput = checkboxWrap.querySelector('input[type="checkbox"]');
        if (!checkboxInput) return;

        // 이미 aria-labelledby가 있으면 건너뛰기
        if (checkboxInput.hasAttribute('aria-labelledby')) return;

        // 체크박스가 속한 row 찾기 (아코디언은 acc_item 우선)
        var accItem = checkboxWrap.closest('.acc_item');
        var row = accItem || checkboxWrap.closest('li[role="row"], li, tr, .list_item');
        if (!row) return;

        var titleElement = null;
        var labelId = null;

        // 1. 아코디언 형태: acc_hd의 .txt 찾기
        var accHd = row.querySelector('.acc_hd .txt');
        if (accHd) {
          titleElement = accHd;
        }

        // 2. 일반 게시판, 이중게시판, QNA: bd_item의 .title > a > span
        if (!titleElement) {
          var titleLink = row.querySelector('.title a');
          if (titleLink) {
            var span = titleLink.querySelector('span');
            titleElement = span || titleLink;
          }
        }

        // 3. video_list, gallery_list_new: .title > span
        if (!titleElement) {
          var titleDiv = row.querySelector('.title');
          if (titleDiv) {
            var span = titleDiv.querySelector('span');
            titleElement = span || titleDiv;
          }
        }

        // 4. 그 외: .txt 클래스 찾기
        if (!titleElement) {
          titleElement = row.querySelector('.txt');
        }

        // titleElement를 찾았으면 ID 생성 및 연결
        if (titleElement) {
          // 기존 ID가 있으면 사용, 없으면 생성
          if (!titleElement.id) {
            globalCounter++;
            labelId = 'txt_' + globalCounter;
            titleElement.id = labelId;
          } else {
            labelId = titleElement.id;
          }

          // 체크박스에 aria-labelledby 추가
          checkboxInput.setAttribute('aria-labelledby', labelId);
        }
      });
    });
  }

  // 초기 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setBoardCheckboxAccessibility);
  } else {
    setBoardCheckboxAccessibility();
  }

  // 동적 콘텐츠를 위한 MutationObserver
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      var shouldUpdate = false;
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('krds_board_list')) {
              shouldUpdate = true;
            } else if (node.querySelector && node.querySelector('.krds_board_list')) {
              shouldUpdate = true;
            }
          }
        });
      });

      if (shouldUpdate) {
        setTimeout(setBoardCheckboxAccessibility, 100);
      }
    });

    function startObserve() {
      if (!document.body) return;
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserve);
    } else {
      startObserve();
    }
  }
})();

// ============================================================
// krds_file_delete 체크박스 관리
// ============================================================
(function () {
  'use strict';

  // 개별 삭제 버튼 클릭 시 같은 li의 체크박스 체크
  function handleIndividualDelete(e) {
    var deleteBtn = e.target.closest('.krds-btn.medium.text');
    if (!deleteBtn) return;

    var li = deleteBtn.closest('li');
    if (!li) return;

    var checkbox = li.querySelector('.krds-form-check input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = true;
      console.log('개별 삭제: 체크박스 체크됨', checkbox.id);
    }
  }

  // 전체 삭제 버튼 클릭 시 같은 file-list의 모든 체크박스 체크
  function handleDeleteAll(e) {
    var deleteAllBtn = e.target.closest('.btn_del_all');
    if (!deleteAllBtn) return;

    var fileDeleteWrap = deleteAllBtn.closest('.krds_file_delete');
    if (!fileDeleteWrap) return;

    var fileList = fileDeleteWrap.querySelector('.file-list');
    if (!fileList) return;

    var checkboxes = fileList.querySelectorAll('.krds-form-check input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
      checkbox.checked = true;
    });

    console.log('전체 삭제: ' + checkboxes.length + '개의 체크박스 체크됨');
  }

  // 이벤트 위임 방식으로 등록
  function initFileDeleteCheckbox() {
    document.addEventListener('click', function (e) {
      // 개별 삭제 버튼 처리
      if (e.target.closest('.krds_file_delete .krds-btn.medium.text')) {
        handleIndividualDelete(e);
      }
      // 전체 삭제 버튼 처리
      else if (e.target.closest('.krds_file_delete .btn_del_all')) {
        handleDeleteAll(e);
      }
    });
  }

  // DOMContentLoaded 시점에 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFileDeleteCheckbox);
  } else {
    initFileDeleteCheckbox();
  }
})();

// section-link 자동 ID 생성 및 네비게이션 링크 연결
(function () {
  'use strict';

  function generateSectionIds() {
    const sections = document.querySelectorAll('.section-link:not([id])');
    if (sections.length === 0) return;

    sections.forEach((section, index) => {
      const tabPanel = section.closest('.tab-conts');
      const scrollCheck = section.closest('.scroll-check');
      const parentId = tabPanel?.id || scrollCheck?.id || null;

      let sectionId = `section_${String(index + 1).padStart(2, '0')}`;

      if (parentId) {
        sectionId = `${parentId}_${String(index + 1).padStart(2, '0')}`;
      }

      let finalId = sectionId;
      let counter = 1;
      while (document.getElementById(finalId)) {
        finalId = `${sectionId}_${counter}`;
        counter++;
      }

      section.id = finalId;
    });
  }

  function updateQuickNavHrefs() {
    const quickNavList = document.querySelector('.krds-in-page-navigation-area .in-page-navigation-list ul');
    if (!quickNavList) return;

    const navLinks = Array.from(quickNavList.querySelectorAll('a'));
    if (navLinks.length === 0) return;

    const sections = Array.from(document.querySelectorAll('.section-link[id]'));
    if (sections.length === 0) return;

    navLinks.forEach((link, index) => {
      if (sections[index]) {
        link.setAttribute('href', `#${sections[index].id}`);
      }
    });
  }

  function initSectionNavigation() {
    const tabPanels = Array.from(document.querySelectorAll('.tab-conts'));
    const hasTabPanelsWithoutId = tabPanels.some((panel) => !panel.id && panel.querySelector('.section-link'));

    if (hasTabPanelsWithoutId) {
      setTimeout(initSectionNavigation, 100);
      return;
    }

    generateSectionIds();
    updateQuickNavHrefs();
  }

  let observer = null;

  function initObserver() {
    if (observer) return; // 이미 초기화된 경우 중복 방지

    if (!document.body) {
      setTimeout(initObserver, 100);
      return;
    }

    observer = new MutationObserver(() => {
      generateSectionIds();
      updateQuickNavHrefs();
    });

    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } catch (error) {
      console.warn('MutationObserver 초기화 실패:', error);
      observer = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSectionNavigation, 200);
      initObserver();
    });
  } else {
    setTimeout(initSectionNavigation, 200);
    initObserver();
  }
})();

// 막대 차트
(function () {
  const fmtComma = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return num.toLocaleString('ko-KR');
  };

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  function initBars(chart) {
    const bars = chart.classList.contains('chart_gap')
      ? [...chart.querySelectorAll('.chart_group .bars .bar')]
      : [...chart.querySelectorAll('.bar')];
    if (!bars.length) return { bars, max: 0 };

    const maxAttr = chart.dataset.max;
    const max = maxAttr ? toNumber(maxAttr) : Math.max(...bars.map((b) => toNumber(b.dataset.value)));

    bars.forEach((bar) => {
      const v = toNumber(bar.dataset.value);
      const pct = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
      bar.style.setProperty('--h', pct + '%');

      let bubble = bar.querySelector('.value');
      if (!bubble) {
        bubble = document.createElement('span');
        bubble.className = 'value';
        const label = bar.querySelector('.label');
        if (label) {
          bar.insertBefore(bubble, label);
        } else {
          bar.appendChild(bubble);
        }
      }
      if (!bubble.textContent.trim()) {
        const isCombo = chart.classList.contains('chart_combo');
        bubble.textContent = isCombo ? fmtComma(v) : String(v);
      }
    });

    return { bars, max };
  }

  function initGap(chart, bars) {
    if (!chart.classList.contains('chart_gap')) return;

    const baseGroup = chart.querySelector('.chart_group.group_base');
    const targetGroup = chart.querySelector('.chart_group.group_target');

    if (!baseGroup || !targetGroup) return;

    const baseBar = baseGroup.querySelector('.bar');
    const targetBars = [...targetGroup.querySelectorAll('.bar')];

    if (!baseBar || !targetBars.length) return;

    const base = toNumber(baseBar.dataset.value);
    const lines = [...chart.querySelectorAll('.gap_line')];

    if (!lines.length) return;

    const baseBarRect = baseBar.getBoundingClientRect();
    const chartPlot = chart.querySelector('.chart_plot');
    const chartPlotRect = chartPlot.getBoundingClientRect();
    const baseBarRightX = baseBarRect.right - chartPlotRect.left;

    lines.forEach((line) => {
      const idx = toNumber(line.dataset.target);
      const targetBar = targetBars?.[idx - 1];
      if (!targetBar) return;

      const target = toNumber(targetBar.dataset.value);
      const gap = base - target;

      const targetBarRect = targetBar.getBoundingClientRect();
      const targetBarLeftX = targetBarRect.left - chartPlotRect.left;

      const targetBarCenterY = targetBarRect.top + targetBarRect.height / 2 - chartPlotRect.top;
      let targetBarCenterPercent = (targetBarCenterY / chartPlotRect.height) * 100;

      if (idx === 1) {
        targetBarCenterPercent = Math.max(50, targetBarCenterPercent);
      } else if (idx === 2) {
        targetBarCenterPercent = Math.max(70, targetBarCenterPercent);
      }

      const lineLeft = baseBarRightX;
      const lineWidth = targetBarLeftX - baseBarRightX;

      line.style.setProperty('--line-left', `${lineLeft}px`);
      line.style.setProperty('--line-width', `${lineWidth}px`);
      line.style.setProperty('--line-top', `${targetBarCenterPercent}%`);

      let pill = line.querySelector('.gap_value');
      if (!pill) {
        pill = document.createElement('span');
        pill.className = 'gap_value';
        line.appendChild(pill);
      }

      const fixed = Math.round(gap * 10) / 10;
      const sign = gap < 0 ? '-' : gap > 0 ? '+' : '';
      pill.textContent = `GAP ${sign}${Math.abs(fixed)}`;

      if (idx === 1) {
        const firstPillX = lineLeft + lineWidth / 2;
        pill.style.left = `${lineWidth / 2}px`;
        line.dataset.pillX = firstPillX.toString();
      } else if (idx === 2) {
        const firstLine = lines.find((l) => toNumber(l.dataset.target) === 1);
        if (firstLine && firstLine.dataset.pillX) {
          const firstPillX = parseFloat(firstLine.dataset.pillX);
          pill.style.left = `${firstPillX - lineLeft}px`;
        } else {
          pill.style.left = `${lineWidth / 2}px`;
        }
      } else {
        pill.style.left = `${lineWidth / 2}px`;
      }

      pill.classList.add('is_visible');
    });
  }

  function initCombo(chart, bars, max) {
    if (!chart.classList.contains('chart_combo')) return;

    const ticksEl = chart.querySelector('.yticks');
    const step = toNumber(chart.dataset.step) || 10000;
    if (ticksEl) {
      ticksEl.innerHTML = '';
      for (let v = max; v >= 0; v -= step) {
        const li = document.createElement('li');
        li.textContent = fmtComma(v);
        ticksEl.appendChild(li);
      }
    }

    const lineWrap = chart.querySelector('.chart_line_overlay');
    const svg = chart.querySelector('.chart_line-svg');
    const path = chart.querySelector('.chart_line-path');
    const pointsWrap = chart.querySelector('.chart_line-points');
    if (!lineWrap || !svg || !path || !pointsWrap) return;

    const rateMax = 100;

    const rect = lineWrap.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    pointsWrap.innerHTML = '';

    const pts = bars.map((bar) => {
      const rate = toNumber(bar.dataset.rate);
      const barRect = bar.getBoundingClientRect();
      const barCenterX = barRect.left + barRect.width / 2 - rect.left;
      const y = h - (rate / rateMax) * h;

      const p = document.createElement('div');
      p.className = 'chart_line-point';
      p.style.left = `${barCenterX}px`;
      p.style.top = `${y}px`;
      pointsWrap.appendChild(p);

      const label = document.createElement('div');
      label.className = 'chart_line-label';
      label.style.left = `${barCenterX}px`;
      label.style.top = `${y}px`;
      label.textContent = `${rate.toFixed(1)}%`;
      pointsWrap.appendChild(label);

      return { x: barCenterX, y };
    });

    svg.setAttribute('viewBox', `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`);

    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    path.setAttribute('d', d);
  }

  function initChartAccessibility(chart, bars) {
    const chartTitle = chart.dataset.title || chart.getAttribute('aria-label') || '차트';

    const allBars = chart.classList.contains('chart_gap')
      ? [...chart.querySelectorAll('.chart_group .bars .bar')]
      : bars;

    const labels = allBars.map((bar) => {
      const desktopLabel =
        bar.querySelector('.label.m-hide') || bar.querySelector('.label:not(.w-hide)') || bar.querySelector('.label');
      let x1 = desktopLabel?.querySelector('.label_main')?.textContent.trim() || '';
      const x2 = desktopLabel?.querySelector('.label_sub')?.textContent.trim() || '';
      const value = toNumber(bar.dataset.value);
      const isCombo = chart.classList.contains('chart_combo');
      let valueStr = isCombo ? fmtComma(value) : String(value);

      if (isCombo && x1) {
        x1 = `${x1}년`;
      }

      if (isCombo) {
        const rate = toNumber(bar.dataset.rate);
        if (rate > 0) {
          valueStr = `${valueStr}(${rate.toFixed(1)}%)`;
        }
      }

      const parts = [x1, x2].filter(Boolean);
      return parts.length > 0 ? `${parts.join(' ')} ${valueStr}` : valueStr;
    });

    const fullLabel = `${chartTitle}: ${labels.join(', ')}`;

    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-label', fullLabel);
  }

  function initChart(chart) {
    if (chart.classList.contains('chart_stack')) return;

    const { bars, max } = initBars(chart);
    initChartAccessibility(chart, bars);

    if (chart.classList.contains('chart_gap')) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const { bars: recalcBars } = initBars(chart);
            initGap(chart, recalcBars);
          }, 100);
        });
      });
    } else {
      initGap(chart, bars);
    }

    if (chart.classList.contains('chart_combo')) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            initCombo(chart, bars, max);
          }, 50);
        });
      });
    } else {
      initCombo(chart, bars, max);
    }
  }

  //   function initAll() {
  //     document.querySelectorAll('.chart').forEach(initChart);
  //   }
  function initAll() {
    document.querySelectorAll('.chart:not(.chart_stack)').forEach(initChart);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.addEventListener('resize', () => {
    document.querySelectorAll('.chart_combo').forEach((chart) => {
      const { bars, max } = initBars(chart);
      initCombo(chart, bars, max);
    });

    document.querySelectorAll('.chart_gap').forEach((chart) => {
      const { bars } = initBars(chart);
      initGap(chart, bars);
    });
  });
})();

// 원형 차트
(function () {
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  function initPie(chart) {
    if (!chart.classList.contains('type_pie')) return;

    const pieWraps = chart.querySelectorAll('.chart_group');
    const isRatio = chart.classList.contains('chart_ratio');

    if (isRatio) {
      const pie = pieWraps[0].querySelector('.pie');
      if (!pie) return;

      const segments = [...pieWraps[0].querySelectorAll('.segment')];
      if (!segments.length) return;

      initSinglePie(pie, segments, chart, pieWraps[0]);
      initPieAccessibilityForRatio(chart, segments);
    } else {
      const chartAccessibilityLabels = [];

      pieWraps.forEach((wrap) => {
        const pie = wrap.querySelector('.pie');
        if (!pie) return;

        const segments = [...wrap.querySelectorAll('.segment')];
        if (!segments.length) return;

        initSinglePie(pie, segments, chart, wrap);

        const titleEl = wrap.querySelector('.title');
        const groupTitle = titleEl?.textContent.trim() || '';
        const total = segments.reduce((sum, seg) => sum + toNumber(seg.dataset.value), 0);

        const labels = segments.map((seg) => {
          const label = seg.dataset.label || '';
          const value = toNumber(seg.dataset.value);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
          return `${label} ${value.toLocaleString('ko-KR')}건 (${percentage}%)`;
        });

        const groupLabel = groupTitle ? `${groupTitle}: ${labels.join(', ')}` : labels.join(', ');

        chartAccessibilityLabels.push(groupLabel);
      });

      if (chartAccessibilityLabels.length > 0) {
        const chartTitle = chart.dataset.title || '원형 차트';
        const fullLabel = `${chartTitle}: ${chartAccessibilityLabels.join(' / ')}`;
        chart.setAttribute('role', 'img');
        chart.setAttribute('aria-label', fullLabel);
      }
    }
  }

  function initSinglePie(pie, segments, chart, wrap) {
    if (!pie || !segments.length) return;

    const total = segments.reduce((sum, seg) => sum + toNumber(seg.dataset.value), 0);
    if (total === 0) return;

    let currentAngle = 0;

    const gradientStops = [];
    segments.forEach((segment, index) => {
      const value = toNumber(segment.dataset.value);
      const percentage = (value / total) * 100;
      const angle = (percentage / 100) * 360;

      const computedStyle = getComputedStyle(segment);
      const color = computedStyle.getPropertyValue('--segment-color').trim() || '#4b79ff';

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      gradientStops.push(`${color} ${startAngle}deg`);
      gradientStops.push(`${color} ${endAngle}deg`);

      if (chart.classList.contains('chart_ratio') && wrap) {
        const container = wrap.querySelector('.pie_wrap');
        if (container) {
          let percentTexts = [...container.querySelectorAll('.percent')];

          if (!percentTexts[index]) {
            const percentEl = document.createElement('span');
            percentEl.className = 'percent';
            container.appendChild(percentEl);
            percentTexts = [...container.querySelectorAll('.percent')];
          }

          const segmentPercentage = (toNumber(segment.dataset.value) / total) * 100;

          const percentText = percentTexts[index];
          if (percentText) {
            percentText.textContent = `${segmentPercentage.toFixed(1)}%`;

            const middleAngle = (startAngle + endAngle) / 2;

            const baseRadius = 25;
            let radiusOffset = (50 - segmentPercentage) * 0.3;

            if (segmentPercentage < 50) {
              radiusOffset -= 5;
            }

            const radius = baseRadius + radiusOffset;

            const angleInRadians = (middleAngle - 90) * (Math.PI / 180);

            let x = 50 + radius * Math.cos(angleInRadians);
            const y = 50 + radius * Math.sin(angleInRadians);

            if (index === 1) {
              x -= 1.5;
            }

            percentText.style.left = `${x}%`;
            percentText.style.top = `${y}%`;
            percentText.style.transform = 'translate(-50%, -50%)';
          }
        }
      }

      currentAngle = endAngle;
    });

    const gradient = `conic-gradient(from 0deg, ${gradientStops.join(', ')})`;
    pie.style.background = gradient;
  }

  function initPieAccessibilityForRatio(chart, segments) {
    const chartTitle = chart.dataset.title || '원형 차트';

    const labels = segments.map((seg) => {
      const label = seg.dataset.label || '';
      const value = toNumber(seg.dataset.value);
      return `${label} ${value}%`;
    });

    const fullLabel = `${chartTitle}: ${labels.join(', ')}`;
    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-label', fullLabel);
  }

  function initAllPies() {
    document.querySelectorAll('.pie').forEach((el) => {
      const deg = el.dataset.rotate || 0;
      el.style.setProperty('--pie-rotate', `${deg}deg`);
    });

    document.querySelectorAll('.type_pie').forEach(initPie);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllPies);
  } else {
    initAllPies();
  }

  window.addEventListener('resize', () => {
    document.querySelectorAll('.type_pie').forEach(initPie);
  });
})();

// ============================================================
// 글자 크기 설정 팝업 제어 (krds_resize)
// ============================================================
(function () {
  'use strict';

  // ── resize 메뉴 내부 mousedown 여부를 capture 단계에서 추적 ──────
  var _mouseInResizeMenu = false;

  document.addEventListener(
    'mousedown',
    function (e) {
      var menus = document.querySelectorAll('.krds_resize .drop-menu');
      _mouseInResizeMenu = Array.prototype.some.call(menus, function (m) {
        return m.contains(e.target);
      });
    },
    true
  );

  document.addEventListener(
    'mouseup',
    function () {
      _mouseInResizeMenu = false;
    },
    true
  );

  // ── krds.js closeAllDropdowns 패치 ──────────────────────────────
  function patchDropEvent() {
    if (typeof krds_dropEvent === 'undefined') return false;
    if (krds_dropEvent._resizePatched) return true;
    var orig = krds_dropEvent.closeAllDropdowns.bind(krds_dropEvent);
    krds_dropEvent.closeAllDropdowns = function () {
      if (_mouseInResizeMenu) return;
      orig();
    };
    krds_dropEvent._resizePatched = true;
    return true;
  }

  // ── 스케일 값 맵 (CSS 변수 의존 없이 JS 내부에서 직접 관리) ────
  // pattern.js 와 동일한 localStorage 키("displayScale") 및 숫자값 사용
  var SCALE_MAP = { small: 0.9, medium: 1.0, large: 1.1, xlarge: 1.3, xxlarge: 1.5 };
  var LS_KEY = 'displayScale';

  function getSavedScale() {
    var v;
    try {
      v = parseFloat(localStorage.getItem(LS_KEY));
    } catch (e) {}
    return v && !isNaN(v) ? v : 1.0;
  }

  function applyZoom(scale) {
    if (
      typeof krds_adjustContentScale !== 'undefined' &&
      krds_adjustContentScale.scaleValue &&
      krds_adjustContentScale.body
    ) {
      krds_adjustContentScale.scaleValue(String(scale));
    } else if (document.body) {
      document.body.style.zoom = scale;
    }
    var wrap = document.getElementById('wrap');
    if (wrap) {
      if (window.innerWidth >= 1024 && scale > 1) {
        wrap.classList.add('krds-scaled-layout');
      } else {
        wrap.classList.remove('krds-scaled-layout');
      }
    }
  }

  // SCALE_MAP 으로 직접 비교 (CSS 변수 의존 없음 → 타이밍 문제 없음)
  function syncRadios(scale) {
    document.querySelectorAll('.krds_resize input[type="radio"]').forEach(function (r) {
      r.checked = Math.abs((SCALE_MAP[r.value] || 1.0) - scale) < 0.001;
    });
  }

  function saveAndApply(scale) {
    applyZoom(scale);
    syncRadios(scale);
    try {
      localStorage.setItem(LS_KEY, String(scale));
    } catch (e) {}
  }

  // ── 페이지 진입 즉시 zoom 복원 ───────────────────────────────────
  (function () {
    var s = getSavedScale();
    if (s !== 1.0) {
      if (document.body) {
        applyZoom(s);
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          applyZoom(getSavedScale());
        });
      }
    }
  })();

  // ── PC / 모바일 라디오 그룹 분리 ────────────────────────────────
  // 모달(krds-popup-resize.html)도 name="scale_level" 을 공유하므로
  // pattern.js 가 모달 라디오를 체크할 때 드롭다운 라디오 체크가 해제되는 문제 방지.
  // PC 와 모바일 모두 독립 그룹으로 분리한다.
  function separateRadioGroups(wraps) {
    if (wraps.length >= 1) {
      wraps[0].querySelectorAll('input[type="radio"]').forEach(function (r) {
        r.name = 'scale_level_pc';
      });
    }
    if (wraps.length >= 2) {
      wraps[1].querySelectorAll('input[type="radio"]').forEach(function (r) {
        r.name = 'scale_level_m';
      });
    }
  }

  function initResizeWrap(resizeWrap) {
    var dropMenu = resizeWrap.querySelector('.drop-menu');
    var dropBtn = resizeWrap.querySelector('.drop-btn');
    var btnClose = resizeWrap.querySelector('.btn-close');
    var btnReset = resizeWrap.querySelector('.btn_ghost');
    var btnSubmit = resizeWrap.querySelector('.primary');

    function closeDropdown() {
      if (dropMenu) dropMenu.style.display = 'none';
      if (dropBtn) {
        dropBtn.classList.remove('active');
        dropBtn.setAttribute('aria-expanded', 'false');
        dropBtn.focus();
      }
    }

    if (dropMenu) {
      dropMenu.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }

    // 라디오 선택 → zoom 미리보기 (아직 저장 안 함)
    resizeWrap.querySelectorAll('input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (this.checked) {
          var s = SCALE_MAP[this.value] || 1.0;
          applyZoom(s);
          syncRadios(s);
        }
      });
    });

    // 설정 버튼 → 현재 선택값 저장 + 닫기
    if (btnSubmit) {
      btnSubmit.addEventListener('click', function (e) {
        e.stopPropagation();
        var checked = resizeWrap.querySelector('input[type="radio"]:checked');
        if (checked) saveAndApply(SCALE_MAP[checked.value] || 1.0);
        closeDropdown();
      });
    }

    // 닫기(x) 버튼 → 저장된 값으로 복원 후 닫기
    if (btnClose) {
      btnClose.addEventListener('click', function (e) {
        e.stopPropagation();
        var s = getSavedScale();
        applyZoom(s);
        syncRadios(s);
        closeDropdown();
      });
    }

    // 초기화 버튼 → 보통(1.0) 저장 + 닫기
    if (btnReset) {
      btnReset.addEventListener('click', function (e) {
        e.stopPropagation();
        saveAndApply(1.0);
        closeDropdown();
      });
    }
  }

  function initResizePopup() {
    var resizeWraps = document.querySelectorAll('.krds_resize');
    if (!resizeWraps.length) return;

    if (!patchDropEvent()) {
      setTimeout(initResizePopup, 100);
      return;
    }

    // 그룹 분리 먼저 → syncRadios 가 양쪽 독립적으로 작동
    separateRadioGroups(resizeWraps);
    Array.prototype.forEach.call(resizeWraps, initResizeWrap);

    // 그룹 분리 직후 한 번, pattern.js 실행 이후에도 한 번 더 동기화
    syncRadios(getSavedScale());
    setTimeout(function () {
      syncRadios(getSavedScale());
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initResizePopup, 400);
    });
  } else {
    setTimeout(initResizePopup, 400);
  }

  document.addEventListener('includesLoaded', function () {
    setTimeout(initResizePopup, 100);
  });
})();

$(function () {
  $('.tab_set').each(function (setIndex) {
    // setIndex를 이용해 고유 ID 생성
    const $set = $(this);
    const $tabList = $set.find('.tab_fc ul');
    const $buttons = $set.find('.tab_fc ul li button');
    const $panels = $set.children('.tab_area').children('div');

    // 접근성: 탭 목록에 role="tablist" 추가
    $tabList.attr('role', 'tablist');

    // 활성화된 탭이 없으면 첫 번째 탭을 활성화
    if ($set.find('.tab_fc ul li.on').length === 0) {
      $set.find('.tab_fc ul li').first().addClass('on');
    }

    // 각 탭 버튼과 패널에 접근성 속성 초기화
    $buttons.each(function (tabIndex) {
      const $button = $(this);
      const $li = $button.closest('li');
      
      const dataIndex = $button.attr('data-index') || $li.attr('data-index');
      const targetClass = dataIndex ? `.tab${dataIndex}` : undefined;
      const $panel = targetClass ? $set.children('.tab_area').children(targetClass) : $panels.eq(tabIndex);

      // 고유 ID 생성
      const tabId = `tab_${setIndex}_${tabIndex}`;
      const panelId = `panel_${setIndex}_${tabIndex}`;

      // 탭 버튼에 ARIA 속성 설정
      $button.attr({
        id: tabId,
        role: 'tab',
        'aria-controls': panelId,
      });

      // 탭 패널에 ARIA 속성 설정
      if ($panel.length) {
        $panel.attr({
          id: panelId,
          role: 'tabpanel',
          'aria-labelledby': tabId,
        });
      }

      // 초기 상태 설정: 'on' 클래스 기준으로 aria-selected와 패널 표시 여부 결정
      if ($li.hasClass('on')) {
        $button.attr('aria-selected', 'true');
        if ($panel.length) $panel.show();
      } else {
        $button.attr('aria-selected', 'false');
        if ($panel.length) $panel.hide();
      }
    });

    // 탭 클릭 이벤트 핸들러
    $buttons.off('click.tabFc').on('click.tabFc', function (e) {
      e.preventDefault();
      const $clickedButton = $(this);
      const $clickedLi = $clickedButton.closest('li');
      const tabIndex = $clickedLi.index();
      
      const dataIndex = $clickedButton.attr('data-index') || $clickedLi.attr('data-index');
      const targetClass = dataIndex ? `.tab${dataIndex}` : undefined;

      // 모든 버튼의 aria-selected를 false로 설정
      $buttons.attr('aria-selected', 'false');
      // 클릭된 버튼만 aria-selected를 true로 설정
      $clickedButton.attr('aria-selected', 'true');

      // 시각적 스타일을 위한 'on' 클래스 제어
      $clickedLi.addClass('on').siblings().removeClass('on');

      // 연결된 패널만 표시
      $panels.hide();
      if (targetClass) {
        $set.children('.tab_area').children(targetClass).show();
      } else {
        $panels.eq(tabIndex).show();
      }
    });
  });
});

// ============================================================
// 자세히보기 버튼 제어 (btn_toggle_more)
// ============================================================
$(function () {
  $(document).on('click', '.btn_toggle_more', function (e) {
    const btn = $(this);
    if (!btn) return;
    btn.toggleClass('on');
    btn.next('.tbl').toggleClass('hide');
  });
});

// esg경영 mbs-mbb 스택 차트
(function () {
  const fmtComma = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n);
    return num.toLocaleString('ko-KR');
  };

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  function getBarSegments(bar) {
    return [...bar.querySelectorAll('.bar_segment[data-value]')];
  }

  function getBarTotal(bar) {
    return getBarSegments(bar).reduce((sum, seg) => sum + toNumber(seg.dataset.value), 0);
  }

  function setSegmentHeights(chart, bars, max) {
    bars.forEach((bar) => {
      const segments = getBarSegments(bar);

      segments.forEach((seg) => {
        const value = toNumber(seg.dataset.value);
        const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

        seg.style.height = `${pct}%`;
        seg.textContent = String(value);
      });
    });
  }

  function setTotals(bars) {
    bars.forEach((bar) => {
      const total = getBarTotal(bar);
      const totalEl = bar.querySelector('.bar_total');
      const stack = bar.querySelector('.bar_stack');
      const segments = getBarSegments(bar);

      if (!totalEl || !stack || !segments.length) return;

      totalEl.textContent = fmtComma(total);

      const topSegment = segments[segments.length - 1];
      const barRect = bar.getBoundingClientRect();
      const topRect = topSegment.getBoundingClientRect();

      const totalTopPx = topRect.top - barRect.top;

      bar.style.setProperty('--total-top', `${totalTopPx}px`);
    });
  }

  function clearHighlights(chart) {
    chart.querySelectorAll('.bar_highlight').forEach((el) => el.remove());
  }

  function setHighlights(chart) {
    clearHighlights(chart);

    const bars = [...chart.querySelectorAll('.bar')];

    bars.forEach((bar) => {
      const stack = bar.querySelector('.bar_stack');
      if (!stack) return;

      const grouped = {};
      const segments = [...stack.querySelectorAll('.bar_segment[data-highlight]')];

      segments.forEach((seg) => {
        const key = seg.dataset.highlight;
        if (!key) return;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(seg);
      });

      Object.values(grouped).forEach((groupSegments) => {
        if (!groupSegments.length) return;

        const first = groupSegments[0];
        const last = groupSegments[groupSegments.length - 1];

        const stackRect = stack.getBoundingClientRect();
        const firstRect = first.getBoundingClientRect();
        const lastRect = last.getBoundingClientRect();

        const extra = 6;

        const top = lastRect.top - stackRect.top;
        const bottom = firstRect.bottom - stackRect.top;
        const height = bottom - top;

        const box = document.createElement('span');
        box.className = 'bar_highlight';

        box.style.top = `${top - extra}px`;
        box.style.height = `${height + extra * 2}px`;

        stack.appendChild(box);
      });
    });
  }

  function initStackAccessibility(chart, bars) {
    const chartTitle = chart.dataset.title || chart.getAttribute('aria-label') || '차트';

    const labels = bars.map((bar) => {
      const year = bar.querySelector('.label .label_main')?.textContent.replace(/\s+/g, ' ').trim() || '';

      const segments = getBarSegments(bar).map((seg) => {
        const type = (seg.dataset.type || '').toUpperCase();
        const value = fmtComma(seg.dataset.value || 0);
        return `${type} ${value}`;
      });

      const total = fmtComma(getBarTotal(bar));

      if (year) {
        return `${year}년 총 ${total}, ${segments.join(', ')}`;
      }

      return `총 ${total}, ${segments.join(', ')}`;
    });

    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-label', `${chartTitle}: ${labels.join('. ')}`);
  }

  function initStackChart(chart) {
    const bars = [...chart.querySelectorAll('.bar')];
    if (!bars.length) return;

    const totals = bars.map(getBarTotal);
    const maxAttr = chart.dataset.max;
    const max = maxAttr ? toNumber(maxAttr) : Math.max(...totals, 0);

    setSegmentHeights(chart, bars, max);
    setTotals(bars, max);
    initStackAccessibility(chart, bars);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setHighlights(chart);
      });
    });
  }

  function initAll() {
    document.querySelectorAll('.chart.chart_stack').forEach(initStackChart);
  }

  function resizeAll() {
    document.querySelectorAll('.chart.chart_stack').forEach((chart) => {
      setHighlights(chart);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.addEventListener('resize', resizeAll);
})();

// 페이지 만족도 평가: 네 → yes_item, 아니오 → no_item
// include.js(data-include) 비동기 삽입 + head 스크립트 시점에 body 없음 → 이벤트 위임 + hf-include-done 사용
(function () {
  'use strict';

  function applyFeedbackVisibility(wrap) {
    const radios = wrap.querySelectorAll('.assess-an input[name="rdo_chip_size2"]');
    const yesItem = wrap.querySelector('.assess-opinion-list .yes_item');
    const noItem = wrap.querySelector('.assess-opinion-list .no_item');
    if (!yesItem || !noItem || radios.length < 2) return;

    const noChecked = radios[1].checked;

    if (noChecked) {
      yesItem.style.display = 'none';
      noItem.style.display = 'flex';
    } else {
      yesItem.style.display = 'flex';
      noItem.style.display = 'none';
    }
  }

  function syncAllFeedbackSatisfaction() {
    document.querySelectorAll('.feedback_wrap').forEach(applyFeedbackVisibility);
  }

  document.addEventListener(
    'change',
    function (e) {
      var t = e.target;
      if (!t || t.nodeName !== 'INPUT' || t.type !== 'radio') return;
      if (t.name !== 'rdo_chip_size2') return;
      var wrap = t.closest('.feedback_wrap');
      if (!wrap) return;
      applyFeedbackVisibility(wrap);
    },
    true
  );

  function bindFeedbackSyncEvents() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncAllFeedbackSatisfaction);
    } else {
      syncAllFeedbackSatisfaction();
    }
    document.addEventListener('hf-include-done', syncAllFeedbackSatisfaction);
  }

  bindFeedbackSyncEvents();
})();

// 대외수상/인증내역 상세(.btn_dtl_info_aw) 토글 슬라이드
document.addEventListener('DOMContentLoaded', function () {
  const slideMs = 350;
  const awardsMobileMq = window.matchMedia('(max-width: 767px)');

  function cancelAwardsAnimation(list) {
    if (list._awardsAnim) {
      list._awardsAnim.cancel();
      list._awardsAnim = null;
    }
    if (list.getAnimations) {
      list.getAnimations().forEach(function (anim) {
        anim.cancel();
      });
    }
  }

  function setAwardsButtonState(btn, expanded) {
    btn.classList.toggle('up', expanded);
    btn.classList.toggle('down', !expanded);
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function openAwardsList(group, list, btn) {
    cancelAwardsAnimation(list);
    setAwardsButtonState(btn, true);
    group.classList.add('open');

    const wasHidden = list.hidden || window.getComputedStyle(list).display === 'none';
    list.hidden = false;
    list.style.display = 'block';
    list.style.overflow = 'hidden';

    const startH = wasHidden ? 0 : list.getBoundingClientRect().height;
    list.style.height = startH + 'px';
    const targetH = list.scrollHeight;

    list._awardsAnim = list.animate(
      [{ height: startH + 'px' }, { height: targetH + 'px' }],
      { duration: slideMs, easing: 'ease', fill: 'forwards' }
    );
    list._awardsAnim.onfinish = function () {
      list.style.height = 'auto';
      list.style.overflow = '';
      list.style.display = '';
      list._awardsAnim = null;
    };
  }

  function closeAwardsList(group, list, btn) {
    cancelAwardsAnimation(list);
    setAwardsButtonState(btn, false);

    list.hidden = false;
    list.style.display = 'block';
    list.style.overflow = 'hidden';

    const startH = list.getBoundingClientRect().height || list.scrollHeight;
    list.style.height = startH + 'px';
    void list.offsetHeight;

    list._awardsAnim = list.animate(
      [{ height: startH + 'px' }, { height: '0px' }],
      { duration: slideMs, easing: 'ease', fill: 'forwards' }
    );
    list._awardsAnim.onfinish = function () {
      group.classList.remove('open');
      list.hidden = true;
      list.style.height = '';
      list.style.overflow = '';
      list.style.display = '';
      list._awardsAnim = null;
    };
  }

  function resetAwardsForWideViewport() {
    document.querySelectorAll('.btn_dtl_info_aw').forEach(function (btn) {
      var group = btn.closest('.event_group');
      if (!group) return;
      var list = group.querySelector('.event_item_list');
      if (!list) return;

      cancelAwardsAnimation(list);
      list.hidden = false;
      list.style.height = '';
      list.style.overflow = '';
      list.style.display = '';
      group.classList.remove('open');
      setAwardsButtonState(btn, false);
    });
  }

  function initAwardsForMobile() {
    document.querySelectorAll('.btn_dtl_info_aw').forEach(function (btn) {
      var group = btn.closest('.event_group');
      if (!group) return;
      var list = group.querySelector('.event_item_list');
      if (!list) return;

      cancelAwardsAnimation(list);
      var expanded = btn.classList.contains('up') || group.classList.contains('open');
      setAwardsButtonState(btn, expanded);
      group.classList.toggle('open', expanded);
      list.hidden = !expanded;
      if (!expanded) {
        list.style.display = 'none';
      } else {
        list.style.display = '';
      }
      list.style.height = '';
      list.style.overflow = '';
    });
  }

  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn_dtl_info_aw');
    if (!btn) return;

    if (!awardsMobileMq.matches) return;

    const group = btn.closest('.event_group');
    if (!group) return;

    const list = group.querySelector('.event_item_list');
    if (!list) return;

    e.preventDefault();

    const isExpanded = btn.getAttribute('aria-expanded') === 'true' || btn.classList.contains('up');

    if (isExpanded) {
      closeAwardsList(group, list, btn);
    } else {
      openAwardsList(group, list, btn);
    }
  });

  if (awardsMobileMq.matches) {
    initAwardsForMobile();
  } else {
    resetAwardsForWideViewport();
  }

  function onAwardsViewportChange() {
    if (awardsMobileMq.matches) {
      initAwardsForMobile();
    } else {
      resetAwardsForWideViewport();
    }
  }

  if (typeof awardsMobileMq.addEventListener === 'function') {
    awardsMobileMq.addEventListener('change', onAwardsViewportChange);
  } else {
    awardsMobileMq.addListener(onAwardsViewportChange);
  }
});

$(document).ready(function () {
// 통합검색
	//검색 필터 드롭다운
	$('.total-search .drop-btn').on('click', function () {
		const $item = $(this).closest('.item');
		const $cont = $item.find('.cont');

		if ($item.hasClass('off')) {
			// 열기
			$item.removeClass('off');
			$cont.stop().slideDown(200);
		} else {
			// 닫기
			$item.addClass('off');
			$cont.stop().slideUp(200);
		}
	});
	//검색 필터 라디오
	$('.radio-type input[type="radio"]').on('change', function() {
		$('.radio-type .radio').removeClass('on');
		if ($(this).is(':checked')) {
			$(this).closest('.radio').addClass('on');
		}
	});
	//적용된 필터
	//리셋
	$('.my-filter-wrap .reset-btn').on('click', function() {
		$(".my-filter-wrap li").remove();
	});
	//키워드 삭제
	$('.my-filter-wrap .remove-btn').on('click', function() {
		$(this).parent("li").remove();
	});
	$('.keyword-list .remove-btn').on('click', function() {
		$(this).parent("li").remove();
	});
	$('.opinion-wrap .chk-wrap input[type="radio"]').on('change', function() {
		$('.chk-wrap .radio').removeClass('on');
		if ($(this).is(':checked')) {
			$(this).closest('.radio').addClass('on');
		}
	});
	$('.total-search-pop-wrap .close-btn').on('click', function() {
		$(this).parents(".total-search-pop-wrap").removeClass("on");
	});
	// 검색 필터 팝업
	$('.m-filter button').on('click', function() {
		$('body').addClass('dim');
		$(".total-search .filter-wrap").addClass("on");
	});
	$('.total-search .filter-wrap .close-btn').on('click', function() {
		$('body').removeClass('dim');
		$(".total-search .filter-wrap").removeClass("on");
	});

	// 사용자 등록 주소, 연락처 추가 및 삭제
	$('.write-form .remove-btn').on('click', function() {
		$(this).parent('.item').remove();
	});
	$(document).on('click', '.add-btn', function () {
      const $wrap  = $(this).closest('.write-form');
      const $items = $wrap.find('.form-wrap.item');
      const $item  = $items.first().clone();      // 첫 item을 깨끗한 템플릿으로 복제

      // 값 초기화
      $item.find('input').val('');
      $item.find('select').prop('selectedIndex', 0);

      $items.last().after($item);                 // ★ 마지막 item의 '다음 형제'로 추가
  });

  $(document).on('click', '.remove-btn', function () {
      $(this).closest('.item').remove();
  });
});


/* =====================================================================
 * HF 전세ON 공통 스크립트 (주택보증)
 * 1) 공통 모달 접근성 : com_pop_cont
 * 2) 검색 팝업 (영업점 검색 / 주소 검색)
 * 3) 가이드 아코디언 (guide_accordion_cont)
 * ===================================================================== */

/* ---------------------------------------------------------------
 * 1) 공통 모달 : role/dialog · ESC 닫기 · 포커스 트랩 · 포커스 복귀
 * --------------------------------------------------------------- */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var seq = 0;

  function focusables(pop) {
    return Array.prototype.filter.call(pop.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  function setup(pop) {
    if (pop.dataset.hfDialog === 'true') return;
    pop.dataset.hfDialog = 'true';

    var area = pop.querySelector('.pop_cont_area');
    if (!area) return;

    var titleEl = area.querySelector('.title_area .title');
    area.setAttribute('role', 'dialog');
    area.setAttribute('aria-modal', 'true');
    if (titleEl) {
      if (!titleEl.id) titleEl.id = 'hf-pop-title-' + (++seq);
      area.setAttribute('aria-labelledby', titleEl.id);
    }
    if (!area.hasAttribute('tabindex')) area.setAttribute('tabindex', '-1');

    var closeBtn = area.querySelector('.title_area .close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        window.hfDialog.close(pop);
      });
    }

    pop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        window.hfDialog.close(pop);
        return;
      }
      if (e.key !== 'Tab') return;
      var list = focusables(area);
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  window.hfDialog = {
    open: function (target, opener) {
      var pop = typeof target === 'string' ? document.getElementById(target) : target;
      if (!pop) return;
      setup(pop);
      pop.hfOpener = opener || document.activeElement;
      pop.classList.add('active');
      document.body.style.overflow = 'hidden';
      var area = pop.querySelector('.pop_cont_area');
      var list = area ? focusables(area) : [];
      (list.length ? list[0] : area).focus();
    },
    close: function (target) {
      var pop = typeof target === 'string' ? document.getElementById(target) : target;
      if (!pop) return;
      pop.classList.remove('active');
      document.body.style.overflow = '';
      if (pop.hfOpener && typeof pop.hfOpener.focus === 'function') {
        pop.hfOpener.focus();
        pop.hfOpener = null;
      }
    }
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.com_pop_cont'), setup);
    // data-pop-open="팝업 id" 를 가진 버튼으로 팝업 열기
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-pop-open]') : null;
      if (!btn) return;
      e.preventDefault();
      window.hfDialog.open(btn.getAttribute('data-pop-open'), btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ---------------------------------------------------------------
 * 2) 검색 팝업 (영업점 검색 / 주소 검색)
 *    - 검색 전 / 검색 후 / 결과 없음 3가지 상태를 제어한다.
 *    - 결과 항목은 마크업에 존재하는 목록을 키워드로 필터링한다.
 *    - .com_pop_cont[data-search] 안에서만 동작한다.
 * --------------------------------------------------------------- */
(function () {
  'use strict';

  function txt(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function setup(pop) {
    if (pop.dataset.hfSearchInit === 'true') return;
    pop.dataset.hfSearchInit = 'true';

    var input = pop.querySelector('[data-search-input]');
    var searchBtn = pop.querySelector('[data-search-btn]');
    var resultBox = pop.querySelector('[data-search-result]');
    var countEl = pop.querySelector('[data-search-count]');
    var listEl = pop.querySelector('[data-search-list]');
    var emptyEl = pop.querySelector('[data-search-empty]');
    var detailEl = pop.querySelector('[data-search-detail]');
    var submitBtn = pop.querySelector('[data-search-submit]');
    if (!input || !resultBox || !listEl) return;

    var items = Array.prototype.slice.call(listEl.children);

    function updateSubmit() {
      if (!submitBtn) return;
      var checked = listEl.querySelector('input[type="radio"]:checked');
      submitBtn.disabled = !checked;
      if (detailEl) detailEl.hidden = !checked;
    }

    function reset() {
      items.forEach(function (li) {
        li.hidden = false;
        var r = li.querySelector('input[type="radio"]');
        if (r) r.checked = false;
      });
      resultBox.hidden = true;
      if (emptyEl) emptyEl.hidden = true;
      if (detailEl) detailEl.hidden = true;
      if (submitBtn) submitBtn.disabled = true;
    }

    function search() {
      var key = input.value.replace(/\s+/g, '').toLowerCase();
      if (!key) {
        reset();
        input.focus();
        return;
      }
      var hit = 0;
      items.forEach(function (li) {
        var match = txt(li).replace(/\s+/g, '').toLowerCase().indexOf(key) > -1;
        li.hidden = !match;
        var r = li.querySelector('input[type="radio"]');
        if (r) r.checked = false;
        if (match) hit++;
      });
      resultBox.hidden = false;
      if (countEl) countEl.textContent = hit + '건';
      listEl.hidden = hit === 0;
      if (emptyEl) emptyEl.hidden = hit !== 0;
      if (detailEl) detailEl.hidden = true;
      if (submitBtn) submitBtn.disabled = true;
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', search);
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        search();
      }
    });
    listEl.addEventListener('change', updateSubmit);

    reset();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('.com_pop_cont.srch_pop'), setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
