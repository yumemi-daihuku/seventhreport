'use strict';
// ════════════════════════════════════════════════════════════════
// gate.js — end.html 到達後の強制リダイレクト管理
//
// end.html で window.gateSetReached() を呼ぶとフラグを記録。
// 他ページでは自動的にフラグをチェックし、到達済みなら画面を乗っ取る。
// ════════════════════════════════════════════════════════════════

(function () {
  const FLAG_KEY  = 'NAZOTOKI_REACHED_END';
  const END_PAGE  = 'end.html';

  // ─── end.html から呼ぶ：フラグをセット ────────────────────────
  window.gateSetReached = function () {
    try { localStorage.setItem(FLAG_KEY, '1'); } catch (e) { /* プライベートブラウズ等 */ }
  };

  // ─── end.html 自身では乗っ取りを行わない ──────────────────────
  if (location.pathname.endsWith(END_PAGE) ||
      location.pathname.endsWith(END_PAGE.replace('.html', ''))) return;

  // ─── フラグ確認 ────────────────────────────────────────────────
  let reached = false;
  try { reached = localStorage.getItem(FLAG_KEY) === '1'; } catch (e) {}
  if (!reached) return;

  // ─── フラグあり：DOMContentLoaded 後に画面を乗っ取る ──────────
  function takeover() {
    // CSS：乗っ取りオーバーレイ
    const style = document.createElement('style');
    style.textContent = `
      #gate-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: #000;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 32px;
        font-family: 'Courier New', monospace;
      }
      #gate-overlay::before {
        content: '';
        position: absolute; inset: 0;
        background: repeating-linear-gradient(
          0deg, transparent, transparent 2px,
          rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px
        );
        pointer-events: none;
      }
      #gate-msg {
        color: #ff2b2b;
        font-size: clamp(13px, 2.5vw, 17px);
        letter-spacing: 3px;
        line-height: 2.4;
        text-align: center;
        text-shadow: 0 0 16px rgba(255,43,43,0.5);
        opacity: 0;
        animation: gate-in 1.2s ease 0.4s forwards;
      }
      #gate-btn {
        background: transparent;
        border: 1px solid #ff2b2b;
        color: #ff2b2b;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        letter-spacing: 3px;
        padding: 14px 36px;
        cursor: pointer;
        opacity: 0;
        animation: gate-in 1s ease 1.8s forwards;
        transition: background 0.2s, box-shadow 0.2s;
      }
      #gate-btn:hover {
        background: rgba(255,43,43,0.1);
        box-shadow: 0 0 16px rgba(255,43,43,0.3);
      }
      @keyframes gate-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    // HTML：オーバーレイ本体
    const overlay = document.createElement('div');
    overlay.id = 'gate-overlay';
    overlay.innerHTML = `
      <div id="gate-msg">
        後戻りはできない。<br>
        お前はもう、そこには戻れない。
      </div>
      <button id="gate-btn" onclick="location.href='end.html'">
        ▸ 最終ファイルへ戻る
      </button>
    `;
    document.body.appendChild(overlay);

    // bodyのスクロールとインタラクションを封鎖
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
    overlay.style.pointerEvents = 'all';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', takeover);
  } else {
    takeover();
  }

})();
