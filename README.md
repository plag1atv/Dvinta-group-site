# Flask перенос проекта из Figma Make (React/Vite)

## Запуск
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app/app.py
```
Откройте http://127.0.0.1:5000

## Где что лежит
- `app/app.py` — маршруты (URL) и рендер шаблонов
- `app/templates/` — HTML (Jinja2)
- `app/templates/partials/` — header/footer
- `app/static/css/styles.css` — CSS (сюда скопирован Tailwind CSS из исходного React проекта)
- `app/static/js/site.js` — простая логика меню/дропдаунов
