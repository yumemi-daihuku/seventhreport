# 🕯️ ホラーARG謎解きゲーム — セットアップガイド

## ファイル構成

```
horror-arg/
├── index.html       入口ページ（怪異報告書 + スクロール数字謎）
├── terminal.html    第1関門：ターミナル認証コード入力
├── archive.html     第2関門：証言から導くキーワード入力
├── signal.html      第3関門：モールス信号LED点滅を解読
├── end.html         エンディング（第一回聴取記録）
├── horror.js        共通ホラー演出ライブラリ
└── gate.js          end.html到達後の封鎖システム
```

---

## 謎の構造と答え（現在の設定）

| ページ | 仕掛け | 答え |
|--------|--------|------|
| `index.html` | スクロールで数字が出現（7・5・3）→積を計算 | **105** |
| `terminal.html` | 被害者一覧の名前の頭文字を順に並べる | **ANOMALY** |
| `archive.html` | 証言から「黄泉」を導く | **YOMI** |
| `signal.html` | モールス信号を解読 | **MIRROR** |

---

## カスタマイズ方法

### terminal.html のコードを変える
```javascript
const CONFIG = {
  CORRECT_CODE: 'ANOMALY', // ← 変更
};
```

### archive.html のパスワードを変える
```javascript
const CONFIG = {
  ANSWERS: ['YOMI', 'yomi', '黄泉'], // ← 変更
};
```

### signal.html の答え（モールス信号の単語）を変える
```javascript
const CONFIG = {
  SECRET_WORD: 'MIRROR',           // モールス信号で送信する単語
  ANSWERS: ['MIRROR', 'mirror'],   // 正解として認める文字列
};
```

---

## GitHub Pages へのデプロイ

1. GitHubで新しいリポジトリを作成
2. 全ファイルをpush（html × 5、horror.js、gate.js）
3. Settings → Pages → Source: `main` ブランチのルート
4. `https://<username>.github.io/<repo>/` でアクセス可能
