# Line Bloom

一個靜態網頁舒壓解謎遊戲。遊戲會把一張正方形原圖切成九宮格並套用多次可逆變換，玩家每輪從三張工具卡中選一張，把圖案慢慢恢復原狀。

## 啟動方式

在專案資料夾執行：

```bash
python3 -m http.server 4173
```

然後打開：

```text
http://localhost:4173
```

這個專案沒有 npm 依賴，直接用瀏覽器跑 `index.html`、`styles.css`、`game.js` 即可。建議用本機 server 開，避免部分瀏覽器對本機檔案和圖片來源有額外限制。

## 使用自己的原圖

側邊欄有兩種方式：

- `原圖來源 URL`：貼上網路圖片網址後按「套用」。
- `本機圖片`：選擇已下載的圖片檔。

建議圖片：

- 正方形或接近正方形。
- 透明背景 PNG/SVG 最適合。
- 線條清楚、主體置中。

注意：有些網站會阻擋圖片熱連，貼 URL 後可能載不出來。這時可以先把圖片下載到本機，再用「本機圖片」套用。

## 可調整的東西

### HTML 設定面板

在 `index.html` 裡可以調整側邊欄控制項，例如：

- 卡片命名模式。
- 回饋資訊模式。
- 原圖參考開關。
- 強力卡片開關。
- 初始變形次數範圍。
- 種子輸入。
- 自訂圖片 URL / 本機圖片。

### 遊戲難度

在 `index.html`：

```html
<input id="difficulty" type="range" min="6" max="24" value="12" />
```

- `min` / `max`：一局初始會套用的變形次數範圍。
- `value`：預設變形次數。

### 變換工具池

在 `game.js` 的 `buildTransformLibrary()` 中調整。

目前包含：

- 整體旋轉、鏡像、調色。
- 單格旋轉、鏡像、位移、調色。
- 九宮格交換。
- 整排/整欄位移、調色、輪換。
- 路徑輪換。

### 發牌與強力牌

在 `game.js`：

- `dealCards()`：控制每輪三張牌如何生成。
- `powerChance()`：控制後期強力牌出現機率。
- `makeBoardPower()` / `stateRepairOps()`：從目前盤面反推有用的強力混合工具。

### 進度計算

在 `game.js` 的 `scoreState(state)` 中調整各種錯誤的權重。

例如：

- 整體旋轉分數。
- 鏡像分數。
- 調色分數。
- 九宮格位置錯誤分數。
- 單格位移、旋轉、色相錯誤分數。

### 動畫特效

主要在 `styles.css`：

- `.fx-board-rotate`
- `.fx-board-flip`
- `.fx-board-color`
- `.fx-board-tile`
- `.fx-board-shift`
- `.fx-board-combo`
- `.is-complete-showcase`

可以調整每種變換的速度、幅度、提示圖形與完成展示動畫。

### 音效

音效在 `game.js` 中用 Web Audio API 合成，不需要音檔。

主要函式：

- `playTransformSound(effect, isPower)`
- `playWinSound()`
- `playTone(...)`

每種變換類型都有對應短音，完成時會播放較長的療癒和弦。

## 檔案結構

```text
index.html   頁面結構與控制項
styles.css   版面、卡片、動畫與完成展示
game.js      遊戲狀態、變換工具、發牌、音效、自訂圖片
README.md    專案說明
```
