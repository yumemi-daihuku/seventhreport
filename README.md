# 🕯️ ホラーARG謎解きゲーム — セットアップガイド

## ファイル構成

```
horror-arg/
├── index.html       入口ページ（怪異報告書）
├── terminal.html    第1関門：URLコード / ターミナル認証
├── archive.html     第2関門：パスワード入力
├── signal.html      第3関門：スペクトログラム謎解き
└── end.html         エンディング
```

---

## 謎の構造と答え（デフォルト）

| ページ | 仕掛け | 答え |
|--------|--------|------|
| `index.html` | HTMLソースに隠された数字 `3, 9, 1, 7` | 積 = **189** |
| `terminal.html` | URLパラメータ or 入力フォーム | **189** |
| `archive.html` | パスワード入力 | **kagami（鏡）** |
| `signal.html` | スペクトログラム上の隠し文字 | **YOMI（黄泉）** |

---

## カスタマイズ方法

### 謎の答えを変える

各ページの先頭付近に `CONFIG` オブジェクトがあります。

**terminal.html**
```javascript
const CONFIG = {
  CORRECT_CODE: '189',       // ← ここを変える
  NEXT_PAGE: 'archive.html',
};
```

**archive.html**
```javascript
const CONFIG = {
  CORRECT_PASSWORDS: ['kagami', 'かがみ', '鏡'],  // ← ここを変える
};
```

**signal.html**
```javascript
const CONFIG = {
  CORRECT_SIGNAL: ['YOMI', 'yomi', '黄泉'],  // ← ここを変える
  HIDDEN_TEXT: 'YOMI',                        // ← Canvasに描く文字（これも変える）
};
```

---

### ストーリーテキストを変える

各ページ内の `<!-- ここにストーリーを書いてください -->` コメントの近くを編集してください。

---

### 難易度調整

**signal.html のスペクトログラム透明度**
```javascript
ctx.globalAlpha = 0.22;  // ← 0に近いほど難しい / 1に近いほど見やすい
```

**archive.html のヒント表示タイミング**
```javascript
if (failCount >= 3) { ... }  // ← 数字を大きくするとヒントが出にくくなる
```

---

## GitHub Pages へのデプロイ

1. GitHubで新しいリポジトリを作成
2. このフォルダ内のファイルをすべてpush
3. Settings → Pages → Source: `main` ブランチのルート
4. `https://<username>.github.io/<repo>/` でアクセス可能

---

## ARGの仕掛け一覧

| 仕掛け | 場所 | 内容 |
|--------|------|------|
| HTMLコメント隠し数字 | `index.html` ソース | 数字3, 9, 1, 7が散在 |
| コンソールメッセージ | `index.html` DevTools | ヒント「9」と次ページへの誘導 |
| URLパラメータ解錠 | `terminal.html` | `?code=189` で直接突破可能 |
| スペクトログラム隠し文字 | `signal.html` Canvas | 透かし文字「YOMI」 |
