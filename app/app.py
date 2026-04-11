import os
import smtplib
from datetime import datetime
from email.message import EmailMessage

from flask import Flask, render_template, request, redirect, url_for

def load_env_file() -> None:
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        ".env",
    )

    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()

            if not line or line.startswith("#"):
                continue

            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()

            if key and key not in os.environ:
                os.environ[key] = value


def create_app() -> Flask:
    app = Flask(__name__)

    load_env_file()

    # ==================== КОНФИГУРАЦИЯ ====================
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

    app.config["MAIL_HOST"] = os.environ.get("MAIL_HOST", "mail.hosting.reg.ru")
    app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", "587"))
    app.config["MAIL_USE_SSL"] = False

    app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "")
    app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "")
    app.config["MAIL_TO"] = os.environ.get("MAIL_TO", "info@csmdvinta.ru")

    @app.context_processor
    def inject_globals():
        return {"current_year": datetime.now().year}

    # ==================== ОТПРАВКА ПИСЕМ ====================
    def send_contact_email(name: str, email: str, phone: str, message: str) -> None:
        mail_username = app.config["MAIL_USERNAME"]
        mail_password = app.config["MAIL_PASSWORD"]
        mail_to = app.config["MAIL_TO"]

        if not mail_username or not mail_password or not mail_to:
            raise ValueError("Не заполнены MAIL_USERNAME, MAIL_PASSWORD или MAIL_TO.")

        email_message = EmailMessage()
        email_message["Subject"] = f"Новая заявка с сайта: {name}"
        email_message["From"] = mail_username
        email_message["To"] = mail_to
        email_message["Reply-To"] = email

        body = f"""Новая заявка с формы контактов

Имя: {name}
Email: {email}
Телефон: {phone}

Сообщение:
{message}
"""
        email_message.set_content(body)

        # ←←← НОВЫЙ ВАРИАНТ ДЛЯ REG.RU (самый стабильный)
        with smtplib.SMTP("mail.hosting.reg.ru", 587) as server:
            server.set_debuglevel(1)
            server.ehlo()

            server.starttls()  # ← ВАЖНО!!!
            server.ehlo()

            server.login(mail_username, mail_password)
            server.send_message(email_message)

    # ==================== МАРШРУТЫ ====================
    @app.get("/")
    def home():
        return render_template("home.html", title="Главная")

    @app.get("/about")
    def about():
        return render_template("about.html", title="О компании")

    @app.route("/contacts", methods=["GET", "POST"])
    def contacts():
        form_data = {
            "name": "",
            "email": "",
            "phone": "",
            "message": "",
        }
        success_message = None
        error_message = None

        if request.method == "POST":
            form_data["name"] = request.form.get("name", "").strip()
            form_data["email"] = request.form.get("email", "").strip()
            form_data["phone"] = request.form.get("phone", "").strip()
            form_data["message"] = request.form.get("message", "").strip()

            if not all([form_data["name"], form_data["email"], form_data["phone"], form_data["message"]]):
                error_message = "Пожалуйста, заполните все обязательные поля формы."
            else:
                try:
                    send_contact_email(
                        name=form_data["name"],
                        email=form_data["email"],
                        phone=form_data["phone"],
                        message=form_data["message"],
                    )
                    success_message = "Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время."
                    form_data = {"name": "", "email": "", "phone": "", "message": ""}
                except Exception as exc:
                    error_message = "Не удалось отправить заявку. Попробуйте позже или напишите нам напрямую."
                    print(f"Ошибка отправки письма: {exc}")

        return render_template(
            "contacts.html",
            title="Контакты",
            success_message=success_message,
            error_message=error_message,
            form_data=form_data,
        )

    # === Остальные маршруты (без изменений) ===
    @app.get("/equipment")
    def equipment():
        return render_template("equipment.html", title="Оборудование")

    # Метrology
    @app.get("/metrology/competence")
    def metrology_competence():
        return render_template("metrology_competence.html", title="Компетентность")

    @app.get("/metrology/verification")
    def metrology_verification():
        return render_template("metrology_verification.html", title="Поверка")

    @app.get("/metrology/calibration")
    def metrology_calibration():
        return render_template("metrology_calibration.html", title="Калибровка")

    @app.get("/metrology/price-list")
    def metrology_price_list():
        return render_template("metrology_price_list.html", title="Прайс-лист")

    @app.get("/metrology/type-approval")
    def metrology_type_approval():
        return render_template("metrology_type_approval.html", title="Испытания для утверждения типа")

    @app.get("/metrology/equipment-testing")
    def metrology_equipment_testing():
        return render_template("metrology_equipment_testing.html", title="Аттестация испытательного оборудования")

    @app.route("/metrology/online-application", methods=["GET", "POST"])
    def metrology_online_application():
        if request.method == "POST":
            return render_template("metrology_online_application.html", title="Онлайн-заявка")

    @app.get("/metrology/acceptance-rules")
    def metrology_acceptance_rules():
        return render_template("metrology_acceptance_rules.html", title="Правила приема")

    @app.get("/metrology/standard-documents")
    def metrology_standard_documents():
        return render_template("metrology_standard_documents.html", title="Нормативные документы")

    # Standardization
    @app.get("/standardization/tu-development")
    def standardization_tu_development():
        return render_template("standardization_tu_development.html", title="Разработка ТУ")

    @app.get("/standardization/sto-development")
    def standardization_sto_development():
        return render_template("standardization_sto_development.html", title="Разработка СТО")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000)