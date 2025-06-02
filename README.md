# 🎨 Color Sort Game

這是一款基於色彩辨識的網頁遊戲，玩家需依照明度或色彩順序點擊色塊。支援多關卡、計時計分與色盲模擬模式。

---

## 🚀 快速開始（本地執行）

### 1️⃣ 下載專案

```bash
git clone https://github.com/你的帳號/你的repo.git
cd 你的repo
```

### 2️⃣ 安裝與啟動前端

```bash
cd frontend
npm install        # 安裝前端套件
npm run dev        # 啟動前端開發伺服器
```

啟動成功後，打開瀏覽器輸入：

👉 http://localhost:5173

即可開始使用！

---

### 3️⃣（可選）啟動後端 API 伺服器

```bash
cd backend
python3 -m venv venv             # 若尚未建立虛擬環境
source venv/bin/activate        # 啟動虛擬環境（Windows 請用 venv\Scripts\activate）
pip install -r requirements.txt # 安裝 FastAPI 套件
uvicorn main:app --reload       # 啟動後端伺服器
```

後端將運行於：

👉 http://localhost:8000

---

## 📦 專案架構

```
WebApp_FinalProject/
├── frontend/           # 前端 React + Vite 專案
│   ├── src/
│   │   └── pages/
│   │       ├── HomePage.tsx
│   │       └── GamePage.tsx
│   └── ...
├── backend/            # 後端 FastAPI 專案
│   ├── main.py
│   └── ...
├── README.md
└── ...
```