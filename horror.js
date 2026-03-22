'use strict';
// ════════════════════════════════════════════════════════════════
// horror.js — 全ページ共通ホラー演出
//
// ページ固有設定：window.HORROR_CONFIG で上書き
// 状況通知API：window.horrorSetState('solved') で解決済みを伝える
// ════════════════════════════════════════════════════════════════

(function () {

  const DEFAULT = {
    eyeDelay:      8000,
    stareInterval: 15000,
    blackoutDelay: 60000,
    blackoutMsg:   'お前は正しい道を進んでいる。\nそのまま、続けろ。',
    viewerMax:     7,

    // ── 離脱メッセージ：状態ごとに定義
    // state: 'unsolved'（未解決）/ 'solved'（解決済み）
    leaveMessages: {
      unsolved: [
        '待て。まだ終わっていない。',
        '……逃げても、また戻ってくる。',
      ],
      solved: [
        '次へ進め。もうすぐだ。',
        '……あと少しだ。',
      ],
    },

    // ── タブ切り替え時メッセージ：状態ごと
    tabMessages: {
      unsolved: [
        '……戻ってきたか。そうだ、ここにいろ。',
        'どこへ行っても、続きが気になるだろう。',
      ],
      solved: [
        '……次が待っている。',
        '戻ってきたなら、進め。',
      ],
    },
  };

  const C = Object.assign({}, DEFAULT, window.HORROR_CONFIG || {});
  // leaveMessages / tabMessages は深くマージ
  if (window.HORROR_CONFIG?.leaveMessages)
    C.leaveMessages = Object.assign({}, DEFAULT.leaveMessages, window.HORROR_CONFIG.leaveMessages);
  if (window.HORROR_CONFIG?.tabMessages)
    C.tabMessages = Object.assign({}, DEFAULT.tabMessages, window.HORROR_CONFIG.tabMessages);

  // ── 状態管理（外部から window.horrorSetState() で変更できる）
  let _state = 'unsolved'; // 'unsolved' | 'solved'
  window.horrorSetState = function (s) { _state = s; };

  // ════════════════════════════════════════════════════
  // DOM生成
  // ════════════════════════════════════════════════════
  function injectDOM() {
    const css = `
      #h-eye {
        position:fixed; pointer-events:none; z-index:8000;
        font-family:'Courier New',monospace; font-size:11px; letter-spacing:2px;
        color:rgba(192,57,43,0); white-space:nowrap;
        text-shadow:0 0 6px rgba(192,57,43,0.4);
        transition:color 1.2s ease; transform:translate(0,-50%);
      }
      #h-eye.on { color:rgba(192,57,43,0.55); }

      /* 画面下メッセージ */
      #h-bottom {
        position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
        font-family:'Courier New',monospace; font-size:13px; letter-spacing:3px;
        color:#ff2b2b; text-shadow:0 0 12px rgba(255,43,43,0.6);
        pointer-events:none; z-index:8500; white-space:nowrap;
        opacity:0; transition:opacity 0.35s ease;
      }
      #h-bottom.on { opacity:1; }

      /* 暗転 */
      #h-blackout {
        position:fixed; inset:0; background:#000;
        z-index:9500; opacity:0; pointer-events:none;
        transition:opacity 0.8s ease;
        display:flex; align-items:center; justify-content:center;
      }
      #h-blackout.on { opacity:1; pointer-events:all; }
      #h-blackout p {
        font-family:'Courier New',monospace;
        color:#ff2b2b; font-size:clamp(13px,2.5vw,19px);
        letter-spacing:4px; line-height:2.4; text-align:center;
        text-shadow:0 0 20px rgba(255,43,43,0.5);
        opacity:0; transition:opacity 1.2s ease 0.7s;
      }
      #h-blackout.on p { opacity:1; }

      /* シェイク */
      @keyframes h-shake {
        0%,100%{transform:translateX(0) translateY(0)}
        10%,50% {transform:translateX(-4px) translateY(1px)}
        20%,60% {transform:translateX(4px) translateY(-2px)}
        30%,70% {transform:translateX(-3px) translateY(2px)}
        40%,80% {transform:translateX(3px) translateY(-1px)}
        90%     {transform:translateX(-2px)}
      }
      body.h-shaking { animation:h-shake 0.5s ease; }

      /* 赤フラッシュ */
      #h-flash {
        position:fixed; inset:0; pointer-events:none; z-index:9400;
        background:transparent; transition:background 0s;
      }
      #h-flash.on   { background:rgba(110,0,0,0.32); transition:background 0.08s ease; }
      #h-flash.fade { background:transparent; transition:background 0.5s ease; }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('afterbegin', `
      <div id="h-eye">…まだ読んでいる</div>
      <div id="h-bottom"></div>
      <div id="h-flash"></div>
      <div id="h-blackout"><p></p></div>
    `);
  }

  // ════════════════════════════════════════════════════
  // シェイク＋赤フラッシュ
  // ════════════════════════════════════════════════════
  function shake(withFlash = true) {
    document.body.classList.remove('h-shaking');
    void document.body.offsetWidth;
    document.body.classList.add('h-shaking');
    setTimeout(() => document.body.classList.remove('h-shaking'), 550);
    if (withFlash) {
      const f = document.getElementById('h-flash');
      f.classList.remove('on', 'fade');
      void f.offsetWidth;
      f.classList.add('on');
      setTimeout(() => { f.classList.remove('on'); f.classList.add('fade'); }, 80);
      setTimeout(() => f.classList.remove('fade'), 600);
    }
  }

  // ════════════════════════════════════════════════════
  // 画面下メッセージ表示（外部から呼べるよう公開）
  // ════════════════════════════════════════════════════
  let _bottomTimer = null;
  function showBottom(msg, duration = 3500) {
    const el = document.getElementById('h-bottom');
    if (!el) return;
    clearTimeout(_bottomTimer);
    el.textContent = msg;
    el.classList.add('on');
    _bottomTimer = setTimeout(() => el.classList.remove('on'), duration);
  }
  // 外部スクリプト（各ページのJS）から呼べるよう公開
  window.horrorShowBottom = showBottom;
  window.horrorShake      = shake;

  // ════════════════════════════════════════════════════
  // [演出1] マウス追跡：視線テキスト
  // ════════════════════════════════════════════════════
  function initEye() {
    const el = document.getElementById('h-eye');
    const MSGS = [
      '…そうだ、読め',
      '…もっと深く',
      '…正しい道を進んでいる',
      '…あと少しだ',
      '…全部見ろ',
    ];
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;
    let msgIdx = 0;

    setTimeout(() => {
      el.classList.add('on');
      setInterval(() => {
        msgIdx = (msgIdx + 1) % MSGS.length;
        el.textContent = MSGS[msgIdx];
      }, 7000);
    }, C.eyeDelay);

    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    document.addEventListener('touchmove', e => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });

    (function track() {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      el.style.left = (cx + 28) + 'px';
      el.style.top  = cy + 'px';
      requestAnimationFrame(track);
    })();
  }

  // ════════════════════════════════════════════════════
  // [演出2] スクロール停止 → シェイク＋メッセージ
  // ════════════════════════════════════════════════════
  function initStare() {
    const MSGS = ['続きがある', 'もっと下だ', '……正しい', '全部読め', '近づいている'];
    let timer = null;
    let count = 0;
    window.addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        count++;
        shake(true);
        if (Math.random() < 0.6) showBottom(MSGS[count % MSGS.length]);
      }, C.stareInterval);
    }, { passive: true });
  }

  // ════════════════════════════════════════════════════
  // [演出3] 暗転
  // ════════════════════════════════════════════════════
  function initBlackout() {
    setTimeout(() => {
      const el  = document.getElementById('h-blackout');
      const txt = el.querySelector('p');
      txt.innerHTML = C.blackoutMsg.replace(/\n/g, '<br>');
      el.classList.add('on');
      setTimeout(() => el.classList.remove('on'), 5000);
    }, C.blackoutDelay);
  }

  // ════════════════════════════════════════════════════
  // [演出4] 離脱検知（マウスが上端から出る＋タブ切り替え）
  // ════════════════════════════════════════════════════
  function initLeaveDetect() {
    let leaveCount = 0;
    let tabCount   = 0;
    let suppress   = false;

    // ── マウスがブラウザUI方向へ出た時
    document.addEventListener('mouseleave', e => {
      if (e.clientY > 10 || suppress) return;
      suppress = true;

      const msgs  = C.leaveMessages[_state] || C.leaveMessages.unsolved;
      const msg   = msgs[leaveCount % msgs.length];
      leaveCount++;

      shake(true);
      showBottom(msg, 4000);

      setTimeout(() => { suppress = false; }, 2500);
    });

    // ── タブ切り替え（非表示→表示に戻った時）
    // hidden になった瞬間ではなく、"戻ってきた" タイミングで表示することで
    // 「戻ってきてしまったな」という演出にする
    let wasHidden = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        wasHidden = true;
        return;
      }
      // タブが見えた状態に戻った
      if (!wasHidden) return;
      wasHidden = false;

      const msgs = C.tabMessages[_state] || C.tabMessages.unsolved;
      const msg  = msgs[tabCount % msgs.length];
      tabCount++;

      // 少し遅延させてから表示（戻ってきた直後に出す）
      setTimeout(() => {
        shake(true);
        showBottom(msg, 4000);
      }, 400);
    });
  }

  // ════════════════════════════════════════════════════
  // [演出5] 閲覧者数カウンター
  // ════════════════════════════════════════════════════
  function initViewer() {
    const el = document.getElementById('header-viewer');
    if (!el) return;
    let count = 1;
    function inc() {
      if (count >= C.viewerMax) return;
      count++;
      el.textContent = `VIEWER: ${count}`;
      el.style.color = count >= 5 ? '#ff2b2b' : '#ffb300';
      if (count >= 5) shake(false);
      setTimeout(inc, (15 + Math.random() * 30) * 1000);
    }
    setTimeout(inc, 20000);
  }

  // ════════════════════════════════════════════════════
  // 初期化
  // ════════════════════════════════════════════════════
  function init() {
    injectDOM();
    initEye();
    initStare();
    initBlackout();
    initLeaveDetect();
    initViewer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
