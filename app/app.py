from datetime import datetime
from flask import Flask, render_template

def create_app() -> Flask:
    app = Flask(__name__)

    @app.context_processor
    def inject_globals():
        return {"current_year": datetime.now().year}

    @app.get("/")
    def home():
        return render_template("home.html", title="Главная")

    @app.get("/about")
    def about():
        return render_template("about.html", title="О компании")

    @app.get("/contacts")
    def contacts():
        return render_template("contacts.html", title="Контакты")

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
        return render_template("metrology_equipment_testing.html", title="Испытания оборудования")

    @app.get("/metrology/online-application")
    def metrology_online_application():
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
    create_app().run(debug=True)
