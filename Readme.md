# 🧠 Self-Hosted Bookmarks Organizer (Django)

A privacy-first, self-hosted web app to organize, categorize, and manage bookmarks — enhanced with AI-assisted categorization, dark mode UI, and optional cloud sync.  
Built with **Django** to demonstrate full-stack web development skills for job interviews and real-world portfolio use.

---

## 🚀 Features

- 🏷️ Smart bookmark categorization (manual & AI-based)
- 🌓 Modern dashboard with dark mode
- 🧩 Modular app design (`accounts`, `bookmarks`, `dashboard`, `landing`)
- 🔐 User authentication (Django `accounts`)
- 💾 SQLite for local storage (easily upgradable to PostgreSQL)
- 📤 Import/export bookmarks (JSON)
- 🧠 Background AI categorization service (planned)
- ⚙️ REST API for integration and automation (future enhancement)
- 🧰 Clean codebase following Django best practices

---

## 🗂️ Project Structure

    bookmarks_organizer/
    ├── accounts/ # Handles user authentication & profiles
    ├── bookmarks/ # Core logic: models, forms, CRUD views
    ├── dashboard/ # User-facing UI, JS, and templates
    ├── landing/ # Public-facing landing page
    ├── bookmarks_organizer/ # Django project settings, URLs, WSGI
    ├── db.sqlite3 # Default local database
    ├── manage.py # Django management script
    └── scan.py # Utility for scanning/importing bookmarks

---

## 🛠️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/selfhosted-bookmarks.git
cd selfhosted-bookmarks
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Apply migrations

```bash
python manage.py migrate
```

### 5. Create a superuser

```bash
python manage.py createsuperuser
```

### 6. Run the development server

```bash
python manage.py runserver
```

### 7.Visit → http://127.0.0.1:8000