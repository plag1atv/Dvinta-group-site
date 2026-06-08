import os
import smtplib
import json
from pathlib import Path
from datetime import datetime
from email.message import EmailMessage

from flask import Flask, render_template, request, redirect, url_for, session, jsonify

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
    app.config["ADMIN_LOGIN"] = os.environ.get("ADMIN_LOGIN", "admin_panel_dvinta")
    app.config["ADMIN_PASSWORD"] = os.environ.get("ADMIN_PASSWORD", "Dvinta_tpa3B_Px")
    app.config["PRICE_ITEMS_PATH"] = (Path(app.root_path) / "static" / "data" / "price_items.json"
    )

    @app.context_processor
    def inject_globals():
        return {"current_year": datetime.now().year}

    # ==================== ОТПРАВКА ПИСЕМ ====================
    def send_contact_email(name: str, email: str, phone: str, message: str) -> None:
        mail_username = app.config["MAIL_USERNAME"]
        mail_password = app.config["MAIL_PASSWORD"]
        mail_to = app.config["MAIL_TO"]
        mail_host = app.config["MAIL_HOST"]
        mail_port = app.config["MAIL_PORT"]

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

        with smtplib.SMTP(mail_host, mail_port) as server:
            server.set_debuglevel(1)
            server.ehlo()
            server.starttls()
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

    def is_price_admin():
        return session.get("price_admin_logged_in") is True


    def read_price_items():
        price_path = app.config["PRICE_ITEMS_PATH"]

        if not price_path.exists():
            return []

        with price_path.open("r", encoding="utf-8") as file:
            return json.load(file)


    def write_price_items(items):
        price_path = app.config["PRICE_ITEMS_PATH"]

        with price_path.open("w", encoding="utf-8") as file:
            json.dump(items, file, ensure_ascii=False, indent=2)

    @app.route("/admin/price-login", methods=["GET", "POST"])
    def admin_price_login():
        error_message = None

        if request.method == "POST":
            login = request.form.get("login", "").strip()
            password = request.form.get("password", "").strip()

            if (
                login == app.config["ADMIN_LOGIN"]
                and password == app.config["ADMIN_PASSWORD"]
            ):
                session["price_admin_logged_in"] = True
                return redirect(url_for("admin_price_panel"))

            error_message = "Неверный логин или пароль."

        return render_template(
            "admin_price_login.html",
            title="Вход в админ-панель",
            error_message=error_message,
        )


    @app.get("/admin/price")
    def admin_price_panel():
        if not session.get("price_admin_logged_in"):
            return redirect(url_for("admin_price_login"))

        return render_template(
            "admin_price_panel.html",
            title="Управление прайс-листом",
        )

    @app.get("/api/price-items")
    def public_get_price_items():
        items = read_price_items()

        response = jsonify(items)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

        return response


    @app.get("/admin/api/price-items")
    def admin_get_price_items():
        if not is_price_admin():
            return jsonify({"error": "unauthorized"}), 401

        items = read_price_items()

        return jsonify(items)


    @app.post("/admin/api/price-items")
    def admin_add_price_item():
        if not is_price_admin():
            return jsonify({"error": "unauthorized"}), 401

        data = request.get_json() or {}
        items = read_price_items()

        new_id = max([int(item.get("id", 0)) for item in items], default=0) + 1

        new_item = {
            "id": new_id,
            "code": data.get("code", "").strip(),
            "section": data.get("section", "").strip(),
            "name": data.get("name", "").strip(),
            "range": data.get("range", "").strip(),
            "verification_price": data.get("verification_price", "").strip(),
            "calibration_price": data.get("calibration_price", "").strip(),
            "note": data.get("note", "").strip(),
        }

        if not new_item["name"]:
            return jsonify({"error": "name_required"}), 400

        if not new_item["section"]:
            return jsonify({"error": "section_required"}), 400

        items.append(new_item)
        write_price_items(items)

        return jsonify(new_item), 201


    @app.delete("/admin/api/price-items/<int:item_id>")
    def admin_delete_price_item(item_id):
        if not is_price_admin():
            return jsonify({"error": "unauthorized"}), 401

        items = read_price_items()

        new_items = [
            item for item in items
            if int(item.get("id", 0)) != item_id
        ]

        if len(new_items) == len(items):
            return jsonify({"error": "not_found"}), 404

        write_price_items(new_items)

        return jsonify({"success": True})


    @app.get("/admin/price-logout")
    def admin_price_logout():
        session.pop("price_admin_logged_in", None)
        return redirect(url_for("metrology_price_list"))

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