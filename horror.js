'use strict';
// ════════════════════════════════════════════════════════════════
// horror.js — 全ページ共通ホラー演出
// 各ページの <body> 直前で <script src="horror.js"></script> として読み込む
// ページ固有の設定は window.HORROR_CONFIG で上書き可能
// ════════════════════════════════════════════════════════════════

(function () {

  // ── デフォルト設定（ページ側で window.HORROR_CONFIG を定義すると上書きされる）
  const DEFAULT = {
    eyeDelay:        8000,   // 視線テキストが出始めるまでの時間(ms)
    stareInterval:   15000,  // スクロール停止判定の秒数(ms)
    blackoutDelay:   60000,  // 暗転が発生するまでの時間(ms)
    blackoutMsg:     'お前はまだここにいる。\nそれは、認識された、ということだ。',
    viewerMax:       7,      // 閲覧者数の上限
    closeMessages: [         // タブ離脱時メッセージ（繰り返すたびに進む）
      'このページから離れようとしている。',
      '……戻ってくることになる。',
    ],
  };
  const C = Object.assign({}, DEFAULT, window.HORROR_CONFIG || {});

  // ════════════════════════════════════════════════════
  // DOM生成：演出用要素を <body> に追加
  // ════════════════════════════════════════════════════
  function injectDOM() {
    const css = `
      /* ── 視線テキスト ── */
      #h-eye {
        position:fixed; pointer-events:none; z-index:8000;
        font-family:'Courier New',monospace; font-size:11px; letter-spacing:2px;
        color:rgba(192,57,43,0); white-space:nowrap;
        text-shadow:0 0 6px rgba(192,57,43,0.4);
        transition:color 1.2s ease;
        transform:translate(0,-50%);
      }
      #h-eye.on { color:rgba(192,57,43,0.55); }

      /* ── 画面下メッセージ（スクロール停止 / タブ離脱共用） ── */
      #h-bottom {
        position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
        font-family:'Courier New',monospace; font-size:13px; letter-spacing:3px;
        color:#ff2b2b; text-shadow:0 0 12px rgba(255,43,43,0.6);
        pointer-events:none; z-index:8500; white-space:nowrap;
        opacity:0; transition:opacity 0.35s ease;
      }
      #h-bottom.on { opacity:1; }

      /* ── 暗転オーバーレイ ── */
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

      /* ── ページシェイク ── */
      @keyframes h-shake {
        0%,100%{transform:translateX(0) translateY(0)}
        10%,50% {transform:translateX(-4px) translateY(1px)}
        20%,60% {transform:translateX(4px) translateY(-2px)}
        30%,70% {transform:translateX(-3px) translateY(2px)}
        40%,80% {transform:translateX(3px) translateY(-1px)}
        90%     {transform:translateX(-2px)}
      }
      body.h-shaking { animation:h-shake 0.5s ease; }

      /* ── 赤フラッシュ ── */
      #h-flash {
        position:fixed; inset:0; pointer-events:none; z-index:9400;
        background:transparent;
        transition:background 0s;
      }
      #h-flash.on {
        background:rgba(110,0,0,0.32);
        transition:background 0.08s ease;
      }
      #h-flash.fade {
        background:transparent;
        transition:background 0.5s ease;
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const html = `
      <div id="h-eye">…まだ読んでいる</div>
      <div id="h-bottom"></div>
      <div id="h-flash"></div>
      <div id="h-blackout"><p></p></div>
    `;
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // ════════════════════════════════════════════════════
  // [共通] シェイク＋赤フラッシュ
  // ════════════════════════════════════════════════════
  function shake(withFlash = true) {
    document.body.classList.remove('h-shaking');
    void document.body.offsetWidth; // reflow
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
  // [共通] 画面下メッセージ表示
  // ════════════════════════════════════════════════════
  let bottomTimer = null;
  function showBottom(msg, duration = 3500) {
    const el = document.getElementById('h-bottom');
    clearTimeout(bottomTimer);
    el.textContent = msg;
    el.classList.add('on');
    bottomTimer = setTimeout(() => el.classList.remove('on'), duration);
  }

  // ════════════════════════════════════════════════════
  // [演出1] マウス追跡：視線テキスト
  // ════════════════════════════════════════════════════
  function initEye() {
    const el = document.getElementById('h-eye');
    const MSGS = [
      '…まだ読んでいる',
      '…なぜ止まった',
      '…どこを見ている',
      '…こちらを向け',
      '…逃げても無駄だ',
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
  // [演出2] スクロール停止 → 15秒後にシェイク＋メッセージ（ランダムで表示）
  // ════════════════════════════════════════════════════
  function initStare() {
    const MSGS = [
      'なぜ止まった',
      '読め',
      '戻るな',
      'もっと下だ',
      '…見ている',
    ];
    let timer = null;
    let count = 0;

    window.addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        count++;
        shake(true); // 常にシェイク＋フラッシュ

        // メッセージはランダムで約60%の確率で表示
        if (Math.random() < 0.6) {
          const msg = MSGS[count % MSGS.length];
          showBottom(msg);
        }
      }, C.stareInterval);
    }, { passive: true });
  }

  // ════════════════════════════════════════════════════
  // [演出3] 暗転（60秒後）
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
  // [演出4] タブ離脱検知 → シェイク＋画面下メッセージ
  // ════════════════════════════════════════════════════
  function initLeaveDetect() {
    let leaveCount = 0;
    let suppress   = false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden || suppress) return;
      // ページが見えている状態でvisibilitychangeが戻ってきた
      // = タブを切り替えて戻ってきた → その時にも出す
    });

    // mouseleave：マウスがウィンドウ外（≒閉じようとした）
    document.addEventListener('mouseleave', e => {
      // 上端に向かって出た場合のみ（ブラウザUIへの移動 = 閉じようとする動き）
      if (e.clientY > 10 || suppress) return;
      suppress = true;

      const msg = C.closeMessages[Math.min(leaveCount, C.closeMessages.length - 1)];
      leaveCount++;

      shake(true);
      showBottom(msg, 4000);

      setTimeout(() => { suppress = false; }, 2500);
    });
  }

  // ════════════════════════════════════════════════════
  // [演出5] 閲覧者数カウンター（header-viewerがある場合）
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
