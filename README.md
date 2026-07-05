# TOEIC 600 Flashcards 📚

Website học flashcard 600 từ vựng TOEIC qua 49 chủ đề — có phát âm, theo dõi tiến trình, responsive.

**Live demo**: `https://<username>.github.io/<repo-name>/`

---

## ✨ Tính năng

- **49 chủ đề** từ vựng TOEIC (593 từ thực tế)
- **Flashcard lật 3D** — front: từ tiếng Anh + loại từ; back: nghĩa tiếng Việt
- **Phát âm** bằng Web Speech API (miễn phí, không cần API key)
- **Phím tắt**: `←` `→` chuyển thẻ, `Space` lật, `Enter` phát âm, `1` Đã nhớ, `2` Chưa nhớ
- **Lưu tiến trình** vào localStorage — không cần tài khoản
- **Trang tổng quan** — % hoàn thành từng chủ đề + vòng tròn tiến trình
- **Responsive** — dùng tốt trên mobile

---

## 📁 Cấu trúc

```
600-toeic/
├── index.html          # Trang chủ — lưới 49 chủ đề
├── study.html          # Trang học flashcard
├── overview.html       # Trang tổng quan tiến trình
├── css/
│   └── style.css       # Design system (dark mode + glassmorphism)
├── js/
│   ├── app.js          # Logic trang chủ
│   ├── study.js        # Logic flashcard + phát âm + localStorage
│   └── overview.js     # Logic tổng quan
└── data/
    └── toeic_vocab.json  # Dữ liệu từ vựng (49 chủ đề, 593 từ)
```

---

## 🚀 Chạy local

Mở trực tiếp `index.html` trong browser **không hoạt động** do `fetch()` bị chặn bởi CORS policy.  
Dùng một trong các cách sau:

### Cách 1: VS Code Live Server (khuyến nghị)
1. Cài extension [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Click chuột phải vào `index.html` → **Open with Live Server**

### Cách 2: Python
```bash
# Python 3
python -m http.server 8080
# Mở: http://localhost:8080
```

### Cách 3: Node.js
```bash
npx serve .
# Mở: http://localhost:3000
```

---

## 🌐 Deploy lên GitHub Pages

### Cách A — Deploy thủ công (đơn giản nhất)

1. **Tạo repository** trên GitHub (ví dụ: `toeic-600`)
2. **Push code** lên nhánh `main`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TOEIC 600 flashcard site"
   git branch -M main
   git remote add origin https://github.com/<username>/toeic-600.git
   git push -u origin main
   ```
3. Vào **Settings** → **Pages** → Source: chọn `main` branch, thư mục `/ (root)` → **Save**
4. Chờ ~1 phút → site live tại: `https://<username>.github.io/toeic-600/`

### Cách B — GitHub Actions (tự động deploy mỗi khi push)

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
        id: deployment
```

Sau đó vào **Settings** → **Pages** → Source: chọn **GitHub Actions**.

---

## 📱 Phím tắt (trang học)

| Phím | Chức năng |
|------|-----------|
| `←` | Thẻ trước |
| `→` | Thẻ tiếp theo |
| `Space` | Lật thẻ |
| `Enter` | Phát âm từ |
| `1` | Đánh dấu Đã nhớ |
| `2` | Đánh dấu Chưa nhớ |

---

## 💾 Dữ liệu localStorage

Tiến trình được lưu theo key:
```
toeic_<Tên chủ đề>_<từ vựng>  →  "remembered" | "not_remembered"
```

Ví dụ: `toeic_Contracts_abide by` = `"remembered"`

---

## 📊 Dữ liệu từ vựng

- File: `data/toeic_vocab.json`
- 49 chủ đề, 593 từ (nguồn: 600 Essential Words for the TOEIC)
- Cấu trúc: `{ "Tên chủ đề": [{ "word": "...", "type": "...", "meaning": "..." }] }`
