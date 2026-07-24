import os
import smtplib
import json
from pathlib import Path
from datetime import datetime
from email.message import EmailMessage


from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory

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

    @app.get("/favicon.png")
    def favicon_png():
        return send_from_directory(
            os.path.join(app.root_path, "static", "img"),
            "favicon-120x120.png",
            mimetype="image/png",
        )

    @app.get("/favicon.ico")
    def favicon_ico():
        return send_from_directory(
            os.path.join(app.root_path, "static", "img"),
            "favicon.ico",
            mimetype="image/vnd.microsoft.icon",
        )

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

        # === CAPTCHA ===
        import random
        if request.method == "GET" or 'captcha_answer' not in session:
            a = random.randint(1, 20)
            b = random.randint(1, 20)
            session['captcha_a'] = a
            session['captcha_b'] = b
            session['captcha_answer'] = a + b

        if request.method == "POST":
            form_data["name"] = request.form.get("name", "").strip()
            form_data["email"] = request.form.get("email", "").strip()
            form_data["phone"] = request.form.get("phone", "").strip()
            form_data["message"] = request.form.get("message", "").strip()
            user_answer = request.form.get("captcha", "").strip()

            if not user_answer or int(user_answer) != session.get('captcha_answer'):
                error_message = "Неверный ответ на проверку. Попробуйте ещё раз."
            elif not all([form_data["name"], form_data["email"], form_data["phone"], form_data["message"]]):
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

                    # === Генерируем новую CAPTCHA для следующей формы ===
                    a = random.randint(1, 20)
                    b = random.randint(1, 20)
                    session['captcha_a'] = a
                    session['captcha_b'] = b
                    session['captcha_answer'] = a + b

                except Exception as exc:
                    error_message = "Не удалось отправить заявку. Попробуйте позже или напишите нам напрямую."
                    print(f"Ошибка отправки письма: {exc}")

        return render_template(
            "contacts.html",
            title="Контакты",
            success_message=success_message,
            error_message=error_message,
            form_data=form_data,
            # Передаём CAPTCHA только если она нужна
            captcha_a=session.get('captcha_a'),
            captcha_b=session.get('captcha_b')
        )

    # === Категории средств измерений ===
    EQUIPMENT_CATEGORIES = {
        "geometric": {
            "title": "Поверка геометрических средств измерений",
            "kicker": "Геометрические средства измерений",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [
                {
                    "title": "Штангенциркули",
                    "description": "Поверка нониусных, цифровых, специальных, разметочных, путевых штангенциркулей и моделей по ГОСТ 166-89.",
                    "icon": "ruler",
                    "href": "/equipment_calipers.html",
                },
                {
                    "title": "Микрометры",
                    "description": "Поверка гладких, цифровых, листовых, трубных, рычажных, зубомерных, призматических и специальных микрометров.",
                    "icon": "settings-2",
                    "href": "/equipment_micrometers.html",
                },
                {
                    "title": "Штангенглубиномеры",
                    "description": "Поверка цифровых штангенглубиномеров, моделей по ГОСТ 162-90, по ТУ, а также поверка по МИ 965-85 и МИ 2196-92.",
                    "icon": "move-vertical",
                    "href": "/equipment_depth_gauges.html",
                },
                {
                    "title": "Штангенрейсмасы",
                    "description": "Поверка штангенрейсмасов с отсчётом по нониусу, с круговой шкалой, цифровых моделей, по ГОСТ 164-90 и МИ 2190-92.",
                    "icon": "bar-chart-3",
                    "href": "/equipment_height_gauges.html",
                },
                {
                    "title": "Штангентрубомеры",
                    "description": "Поверка штангентрубомеров по госреестрам 89360-23, 73265-18, 32950-12 и 32950-06.",
                    "icon": "circle",
                    "href": "/equipment_pipe_calipers.html",
                },
                {
                    "title": "Штангензубомеры",
                    "description": "Поверка штангензубомеров, тангенциальных, хордовых и кромочных зубомеров различных моделей.",
                    "icon": "settings-2",
                    "href": "/equipment_gear_tooth_calipers.html",
                },
                {
                    "title": "Глубиномеры микрометрические и индикаторные",
                    "description": "Поверка микрометрических и индикаторных глубиномеров ГМ, ГМЦ и ГИ, изготовленных по ГОСТ и техническим условиям.",
                    "icon": "scan-line",
                    "href": "/equipment_micrometric_depth_gauges.html",
                },
                {
                    "title": "Скобы с отсчётным устройством",
                    "description": "Поверка рычажных и индикаторных скоб СРП, СР и СИ с различной ценой деления.",
                    "icon": "between-horizontal-start",
                    "href": "/equipment_snap_gauges.html",
                },
                {
                    "title": "Головки и индикаторы измерительные",
                    "description": "Поверка пружинных, рычажно-зубчатых, многооборотных, боковых и часовых измерительных головок и индикаторов.",
                    "icon": "gauge",
                    "href": "/equipment_measuring_heads.html",
                },
                {
                    "title": "Преобразователи и датчики линейных перемещений",
                    "description": "Поверка индуктивных преобразователей и щупов, многоканальных систем, тросовых, стержневых, профильных и лазерных датчиков.",
                    "icon": "move-horizontal",
                    "href": "/equipment_inductive_transducers.html",
                },
                {
                    "title": "Меры длины концевые плоскопараллельные",
                    "description": "Поверка КМД 0–3 классов точности, длиной от 0,1 до 1000 мм, по ГОСТ 9038-90 и установленным методикам поверки.",
                    "icon": "layers-3",
                    "href": "/equipment_gauge_blocks.html",
                },
                {
                    "title": "Кольца установочные, измерительные, образцовые и эталонные",
                    "description": "Поверка колец внутренних диаметров различных типов, моделей, диапазонов и классов точности.",
                    "icon": "circle-dot",
                    "href": "/equipment_measuring_rings.html",
                },
                {
                    "title": "Наборы принадлежностей к концевым мерам длины ПК",
                    "description": "Поверка наборов ПК-1, ПК-2 и ПК-3 по ГОСТ, МИ и другим утверждённым методикам поверки.",
                    "icon": "blocks",
                    "href": "/equipment_gauge_block_accessories.html",
                },
                {
                    "title": "Нутромеры",
                    "description": "Поверка индикаторных, цанговых, микрометрических, трёхточечных и специальных нутромеров.",
                    "icon": "gauge",
                    "href": "/equipment_bore_gauges.html",
                },
                {
                    "title": "Линейки и циркометры",
                    "description": "Поверка металлических, контрольных, поверочных, синусных, охватывающих, усадочных и специальных линеек.",
                    "icon": "ruler",
                    "href": "/equipment_measuring_rulers.html",
                },
                {
                    "title": "Рулетки, метроштоки и измерительные рейки",
                    "description": "Поверка металлических и электронных рулеток, рулеток с лотом, метроштоков, нивелирных, водомерных, гидрометрических и снегомерных реек.",
                    "icon": "move-horizontal",
                    "href": "/equipment_tape_measures_meter_rods.html",
                },
                {
                    "title": "Плиты поверочные и разметочные",
                    "description": "Поверка чугунных и твердокаменных плит различных размеров, исполнений и классов точности.",
                    "icon": "grid-3x3",
                    "href": "/equipment_surface_plates.html",
                },
                {
                    "title": "Уровни",
                    "description": "Поверка рамных, брусковых, строительных, электронных уровней и уровней-угломеров.",
                    "icon": "square",
                    "href": "/equipment_levels.html",
                },
                {
                    "title": "Мерзлотомеры",
                    "description": "Поверка приборов серий АМ-21 и АМ-21М для измерения глубины промерзания почвы.",
                    "icon": "snowflake",
                    "href": "/equipment_frost_depth_gauges.html",
                },
                {
                    "title": "Гриндометры",
                    "description": "Поверка гриндометров ПРОМТ, ГК, BGD-T, Elcometer, Константа-Клин и приборов Хегмана.",
                    "icon": "scan-line",
                    "href": "/equipment_grindometers.html",
                },
                {
                    "title": "Нормалемеры и приборы Multimar",
                    "description": "Поверка зубоизмерительных нормалемеров различных моделей и универсальных приборов Multimar 844 T.",
                    "icon": "settings",
                    "href": "/equipment_normalemeters_multimar.html",
                },
                {
                    "title": "Проволочки и ролики",
                    "description": "Поверка гладких и ступенчатых проволочек, а также измерительных роликов 0 и 1 классов точности.",
                    "icon": "circle-dot",
                    "href": "/equipment_measuring_wires_rollers.html",
                },
                {
                    "title": "Угольники и приборы для их поверки",
                    "description": "Поверка лекальных, слесарных, цилиндрических и твердокаменных угольников, приборов ППУ-630 и модели 2401.",
                    "icon": "triangle-right",
                    "href": "/equipment_verification_squares.html",
                },
                {
                    "title": "Толщиномеры и стенкомеры",
                    "description": "Поверка индикаторных, цифровых, настольных, ручных и контактных толщиномеров, стенкомеров и толщиномеров-гребёнок.",
                    "icon": "scan-line",
                    "href": "/equipment_thickness_wall_gauges.html",
                },
                {
                    "title": "Медицинские ростомеры",
                    "description": "Поверка медицинских, детских и бесконтактных ростомеров различных моделей и исполнений.",
                    "icon": "ruler",
                    "href": "/equipment_medical_stadiometers.html",
                },
                {
                    "title": "Высотомеры и вертикальные длиномеры",
                    "description": "Поверка цифровых, оптических, проекционных высотомеров и вертикальных длиномеров различных производителей.",
                    "icon": "move-vertical",
                    "href": "/equipment_height_vertical_length_gauges.html",
                },
                {
                    "title": "Кронциркули и калибры-скобы",
                    "description": "Поверка измерительных и индикаторных кронциркулей, механических и цифровых калибров-скоб.",
                    "icon": "gauge",
                    "href": "/equipment_calipers_snap_gauges.html",
                },
                {
                    "title": "Щупы, клинья и клиновые высотомеры",
                    "description": "Поверка измерительных щупов, клиньев для измерения зазоров и клиновых высотомеров.",
                    "icon": "layers-3",
                    "href": "/equipment_feeler_gauges_wedges.html",
                },
                {
                    "title": "Комплекты измерителей КИПР",
                    "description": "Поверка комплектов для измерения присоединительных размеров соединителей в коаксиальных волноводах и трактах.",
                    "icon": "radio-tower",
                    "href": "/equipment_kipr_connection_gauges.html",
                },
                {
                    "title": "Приборы контроля подшипников",
                    "description": "Поверка приборов для контроля радиальных и осевых зазоров, а также внутреннего диаметра подшипников.",
                    "icon": "circle-gauge",
                    "href": "/equipment_bearing_clearance_diameter_gauges.html",
                },
                {
                    "title": "Сита лабораторные",
                    "description": "Поверка лабораторных сит всех типоразмеров и модификаций для анализа сыпучих материалов.",
                    "icon": "filter",
                    "href": "/equipment_laboratory_sieves.html",
                },
                {
                    "title": "Измерительные лупы",
                    "description": "Поверка измерительных луп и луп с подсветкой для контроля линейных и угловых размеров.",
                    "icon": "search",
                    "href": "/equipment_measuring_illuminated_magnifiers.html",
                },
                {
                    "title": "Контрольные бруски БК",
                    "description": "Поверка контрольных брусков для проверки прямолинейности лекальных линеек и угольников.",
                    "icon": "ruler",
                    "href": "/equipment_control_bars_bk.html",
                },
                {
                    "title": "Стеклянные пластины ПИ и ПМ",
                    "description": "Поверка плоских и плоскопараллельных стеклянных пластин для интерференционного контроля плоскостности.",
                    "icon": "layers-3",
                    "href": "/equipment_flat_parallel_glass_plates.html",
                },
                {
                    "title": "Образцы шероховатости ОШС",
                    "description": "Поверка образцов шероховатости поверхности для визуальной и тактильной оценки параметров Ra.",
                    "icon": "waves",
                    "href": "/equipment_surface_roughness_samples.html",
                },
                {
                    "title": "Профилометры и профилографы",
                    "description": "Поверка приборов для измерения параметров шероховатости поверхности и характеристик профиля.",
                    "icon": "activity",
                    "href": "/equipment_surface_roughness_profilometers.html",
                },
                {
                    "title": "Микроскопы и видеоизмерительные системы",
                    "description": "Поверка измерительных микроскопов, видеоизмерительных систем и машин для линейного и углового контроля.",
                    "icon": "microscope",
                    "href": "/equipment_microscopes_video_measurement_systems.html",
                },
                {
                    "title": "Комплексы анализа микроструктуры",
                    "description": "Поверка аппаратно-программных комплексов и систем анализа изображений микроструктуры материалов.",
                    "icon": "scan-search",
                    "href": "/equipment_microstructure_image_analysis_systems.html",
                },
                {
                    "title": "Объект-микрометры",
                    "description": "Поверка объект-микрометров для калибровки микроскопов, видеоизмерительных машин и систем анализа изображений.",
                    "icon": "ruler",
                    "href": "/equipment_object_micrometers.html",
                },
                {
                    "title": "Измерительные проекторы",
                    "description": "Поверка оптических, профильных и цифровых проекторов для контроля линейных и угловых размеров.",
                    "icon": "scan-search",
                    "href": "/equipment_measuring_projectors.html",
                },
                {
                    "title": "Автоматизированные оптиметры",
                    "description": "Поверка горизонтальных и вертикальных оптиметров для измерения наружных и внутренних линейных размеров.",
                    "icon": "gauge",
                    "href": "/equipment_automated_optimeters.html",
                },
                {
                    "title": "Длиномеры и цифровые компараторы",
                    "description": "Поверка горизонтальных и вертикальных длиномеров, цифровых компараторов и рабочих эталонов.",
                    "icon": "move-horizontal",
                    "href": "/equipment_length_measuring_machines_comparators.html",
                },
                {
                    "title": "Универсальные приборы для измерений длины",
                    "description": "Поверка высокоточных приборов для абсолютных и относительных измерений наружных и внутренних размеров.",
                    "icon": "ruler",
                    "href": "/equipment_universal_length_measuring_instruments.html",
                },
                {
                    "title": "Оптико-механические машины ИЗМ",
                    "description": "Поверка электронных и оптико-механических машин ИЗМ для измерений длины и контроля прецизионных изделий.",
                    "icon": "settings-2",
                    "href": "/equipment_izm_length_measuring_machines.html",
                },
                {
                    "title": "Координатно-измерительные машины",
                    "description": "Поверка портальных, мостовых и портативных КИМ для контроля геометрии деталей и 3D-сканирования.",
                    "icon": "scan",
                    "href": "/equipment_coordinate_measuring_machines.html",
                },
                {
                    "title": "Контактные интерферометры",
                    "description": "Поверка вертикальных и горизонтальных окулярных и компьютеризированных контактных интерферометров.",
                    "icon": "waves",
                    "href": "/equipment_contact_interferometers.html",
                },
                {
                    "title": "Установки и компараторы для КМД",
                    "description": "Поверка установок, приборов и компараторов для поверки и калибровки концевых мер длины.",
                    "icon": "ruler",
                    "href": "/equipment_gauge_block_verification_systems.html",
                },
                {
                    "title": "Приборы для поверки головок и индикаторов",
                    "description": "Поверка приборов ППГ, ППИ, Precimar, i-Checker, Optimar и Mitutoyo для измерительных головок, датчиков и индикаторов.",
                    "icon": "gauge",
                    "href": "/equipment_measuring_head_indicator_verification_instruments.html",
                },
                {
                    "title": "Биениемеры ПБ",
                    "description": "Поверка приборов ПБ для контроля радиального и торцевого биения деталей, закреплённых в центрах.",
                    "icon": "scan-line",
                    "href": "/equipment_pb_runout_testers.html",
                },
                {
                    "title": "Прогибомеры",
                    "description": "Поверка механических и электронных прогибомеров ПМ, ПСК-МГ4 и 6ПАО для измерения перемещений конструкций.",
                    "icon": "move-vertical",
                    "href": "/equipment_deflection_gauges.html",
                },
                {
                    "title": "Калибраторы датчиков деформаций KMF",
                    "description": "Поверка калибраторов KMF-01, KMF-3 и KMF-100 для проверки линейности датчиков деформации и калибровки усилителей.",
                    "icon": "sliders-horizontal",
                    "href": "/equipment_kmf_strain_sensor_calibrators.html",
                },
                {
                    "title": "Измерители деформации клейковины ИДК",
                    "description": "Поверка измерителей ИДК-М, ИДК-10, ИДК-3М, ИДК-7 и других модификаций для определения качества клейковины.",
                    "icon": "wheat",
                    "href": "/equipment_gluten_deformation_meters.html",
                },
                {
                    "title": "Эталоны чувствительности канавочные",
                    "description": "Поверка канавочных эталонов МЕТР, АРГО, Спрут ЭЧК, ЭЧК1 и ЭЧК2 для радиографического контроля.",
                    "icon": "scan-line",
                    "href": "/equipment_groove_sensitivity_standards.html",
                },
                {
                    "title": "Комплексы доставки средств контроля КДСК",
                    "description": "Поверка всех 16 исполнений КДСК для измерения линейных и угловых координат при неразрушающем контроле.",
                    "icon": "crosshair",
                    "href": "/equipment_kdsk_control_equipment_delivery_complexes.html",
                },
                {
                    "title": "Шаблоны для фасок Holex",
                    "description": "Поверка шаблонов Holex для измерения угла скоса и линейной длины фаски по ГРСИ № 86698-22.",
                    "icon": "ruler",
                    "href": "/equipment_holex_chamfer_gauges.html",
                },
                {
                    "title": "Шаблоны сварщика и специалиста НК",
                    "description": "Поверка универсальных шаблонов сварщика Калиброн, WG, УШК, УШС, Элитест и шаблонов специалиста НК TapiRUS.",
                    "icon": "scan-search",
                    "href": "/equipment_welder_and_ndt_inspection_gauges.html",
                },
                {
                    "title": "Устройства для измерений длины кабеля и материалов",
                    "description": "Поверка измерителей длины кабеля, проводов, рулонных и текстильных материалов, кабельной продукции и протяженных объектов.",
                    "icon": "route",
                    "href": "/equipment_cable_and_extended_object_length_measuring_devices.html",
                },
                {
                    "title": "Установки «СканТрек-2000»",
                    "description": "Поверка установок для автоматического измерения объема и линейных размеров сыпучих материалов в движущихся объектах.",
                    "icon": "scan-line",
                    "href": "/equipment_scantrack_2000_bulk_material_volume_systems.html",
                },
                {
                    "title": "Установки измерения габаритов грузов",
                    "description": "Поверка комплексов КАИГ, КАИГ 2 и установок СканТрек-2100 для бесконтактного измерения длины, ширины и высоты грузов.",
                    "icon": "scan-line",
                    "href": "/equipment_cargo_dimension_measurement_systems.html",
                },
                {
                    "title": "Установки «СканТрек»",
                    "description": "Поверка установок для автоматизированного измерения ширины, высоты, длины, площади сечения и объема движущихся объектов.",
                    "icon": "scan-line",
                    "href": "/equipment_scantrack_moving_object_geometry_system.html",
                },
                {
                    "title": "Лазерные системы измерения длины",
                    "description": "Поверка лазерных систем LDM42A, DP и бесконтактных измерителей длины SL mini и SL.",
                    "icon": "scan-line",
                    "href": "/equipment_laser_length_measurement_systems.html",
                },
                {
                    "title": "Профилемер Elcometer 224",
                    "description": "Поверка цифрового профилемера Elcometer 224 для измерения высоты профиля металлических поверхностей после пескоструйной и дробеструйной очистки.",
                    "icon": "gauge",
                    "href": "/equipment_elcometer_224_surface_profile_gauge.html",
                },
                {
                    "title": "Видеоэндоскопы измерительные",
                    "description": "Поверка измерительных видеоэндоскопов для определения линейных размеров и глубины поверхностных дефектов при визуальном обследовании объектов.",
                    "icon": "scan-search",
                    "href": "/equipment_measuring_video_endoscopes.html",
                },
                {
                    "title": "Меры толщины покрытий",
                    "description": "Поверка мер МТ, натурных мер МТП и комплектов ELCOMETER 990 для калибровки и поверки толщиномеров покрытий.",
                    "icon": "layers-3",
                    "href": "/equipment_coating_thickness_measures.html",
                },
            ],
        },
        "mechanical": {
            "title": "Поверка механических средств измерений",
            "kicker": "Механические средства измерений",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [],
        },
        "flow": {
            "title": "Поверка средств измерений параметров потока, расхода, уровня и объёма веществ",
            "kicker": "Поток, расход, уровень и объём",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [],
        },
        "pressure": {
            "title": "Поверка средств измерений давления и вакуумных измерений",
            "kicker": "Давление и вакуумные измерения",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [],
        },
        "physicochemical": {
            "title": "Поверка средств измерений физико-химического состава и свойств веществ",
            "kicker": "Физико-химический состав и свойства веществ",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [],
        },
        "temperature": {
            "title": "Поверка средств измерений теплофизических и температурных измерений",
            "kicker": "Теплофизические и температурные измерения",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [],
        },
        "time-frequency": {
            "title": "Поверка средств измерений времени и частоты",
            "kicker": "Время и частота",
            "description": "Выберите средство измерений, чтобы узнать подробную информацию о поверке, стоимости услуг и порядке проведения работ.",
            "cards": [],
        },
    }

    @app.get("/equipment")
    def equipment():
        return redirect(url_for("equipment_category", category_slug="geometric"))

    @app.get("/equipment/<category_slug>")
    def equipment_category(category_slug):
        category = EQUIPMENT_CATEGORIES.get(category_slug)

        if category is None:
            return redirect(url_for("metrology_verification"))

        return render_template(
            "equipment_category.html",
            title=category["title"],
            category=category,
            equipment_type=category_slug,
        )


    @app.route("/equipment_calipers.html")
    @app.route("/equipment/shtangentsirkuli")
    def equipment_calipers():

        price_file = Path(app.static_folder) / "data" / "price_items.json"

        with open(price_file, "r", encoding="utf-8") as f:
            price_items = json.load(f)

        calipers = []

        for item in price_items:

            if "штангенциркул" in item["name"].lower():
                calipers.append(item)

        return render_template(
            "equipment_calipers.html",
            title="Поверка штангенциркулей",
            equipment_type="calipers"
        )

    @app.route("/equipment_micrometers.html")
    @app.route("/equipment/micrometers")
    def equipment_micrometers():
        return render_template(
            "equipment_micrometers.html",
            title="Поверка микрометров",
            equipment_type="micrometers"
        )

    @app.route("/equipment_depth_gauges.html")
    @app.route("/equipment/depth-gauges")
    def equipment_depth_gauges():
        return render_template(
            "equipment_depth_gauges.html",
            title="Поверка штангенглубиномеров",
            equipment_type="depth_gauges"
        )

    @app.route("/equipment_height_gauges.html")
    @app.route("/equipment/height-gauges")
    def equipment_height_gauges():
        return render_template(
            "equipment_height_gauges.html",
            title="Поверка штангенрейсмасов",
            equipment_type="height_gauges"
        )

    @app.route("/equipment_pipe_calipers.html")
    @app.route("/equipment/pipe-calipers")
    def equipment_pipe_calipers():
        return render_template(
            "equipment_pipe_calipers.html",
            title="Поверка штангентрубомеров",
            equipment_type="pipe_calipers"
        )

    @app.route("/equipment_gear_tooth_calipers.html")
    @app.route("/equipment/gear-tooth-calipers")
    def equipment_gear_tooth_calipers():
        return render_template(
            "equipment_gear_tooth_calipers.html",
            title="Поверка штангензубомеров",
            equipment_type="gear_tooth_calipers"
        )

    @app.route("/equipment_micrometric_depth_gauges.html")
    @app.route("/equipment/micrometric-depth-gauges")
    def equipment_micrometric_depth_gauges():
        return render_template(
            "equipment_micrometric_depth_gauges.html",
            title="Поверка микрометрических и индикаторных глубиномеров",
            equipment_type="micrometric_depth_gauges"
        )

    @app.route("/equipment_snap_gauges.html")
    @app.route("/equipment/snap-gauges")
    def equipment_snap_gauges():
        return render_template(
            "equipment_snap_gauges.html",
            title="Поверка скоб с отсчётным устройством",
            equipment_type="snap_gauges"
        )

    @app.route("/equipment_measuring_heads.html")
    @app.route("/equipment/measuring-heads")
    def equipment_measuring_heads():
        return render_template(
            "equipment_measuring_heads.html",
            title="Поверка измерительных головок и индикаторов",
            equipment_type="measuring_heads"
        )

    @app.route("/equipment_inductive_transducers.html")
    @app.route("/equipment/inductive-transducers")
    def equipment_inductive_transducers():
        return render_template(
            "equipment_inductive_transducers.html",
            title="Поверка преобразователей и датчиков линейных перемещений",
            equipment_type="inductive_transducers"
        )

    @app.route("/equipment_gauge_blocks.html")
    @app.route("/equipment/gauge-blocks")
    def equipment_gauge_blocks():
        return render_template(
            "equipment_gauge_blocks.html",
            title="Поверка мер длины концевых плоскопараллельных",
            equipment_type="gauge_blocks"
        )

    @app.route("/equipment_measuring_rings.html")
    @app.route("/equipment/measuring-rings")
    def equipment_measuring_rings():
        return render_template(
            "equipment_measuring_rings.html",
            title="Поверка установочных, измерительных, образцовых и эталонных колец",
            equipment_type="measuring_rings"
        )

    @app.route("/equipment_gauge_block_accessories.html")
    @app.route("/equipment/gauge-block-accessories")
    def equipment_gauge_block_accessories():
        return render_template(
            "equipment_gauge_block_accessories.html",
            title="Поверка наборов принадлежностей к концевым мерам длины ПК",
            equipment_type="gauge_block_accessories"
        )

    @app.route("/equipment_bore_gauges.html")
    @app.route("/equipment/bore-gauges")
    def equipment_bore_gauges():
        return render_template(
            "equipment_bore_gauges.html",
            title="Поверка нутромеров",
            equipment_type="bore_gauges"
        )

    @app.route("/equipment_measuring_rulers.html")
    @app.route("/equipment/measuring-rulers")
    def equipment_measuring_rulers():
        return render_template(
            "equipment_measuring_rulers.html",
            title="Поверка линеек и циркометров",
            equipment_type="measuring_rulers"
        )

    @app.route("/equipment_tape_measures_meter_rods.html")
    @app.route("/equipment/tape-measures-meter-rods")
    def equipment_tape_measures_meter_rods():
        return render_template(
            "equipment_tape_measures_meter_rods.html",
            title="Поверка рулеток, метроштоков и измерительных реек",
            equipment_type="tape_measures_meter_rods"
        )

    @app.route("/equipment_surface_plates.html")
    @app.route("/equipment/surface-plates")
    def equipment_surface_plates():
        return render_template(
            "equipment_surface_plates.html",
            title="Поверка поверочных и разметочных плит",
            equipment_type="surface_plates"
        )

    @app.route("/equipment_levels.html")
    @app.route("/equipment/levels")
    def equipment_levels():
        return render_template(
            "equipment_levels.html",
            title="Поверка уровней",
            equipment_type="levels"
        )

    @app.route("/equipment_frost_depth_gauges.html")
    @app.route("/equipment/frost-depth-gauges")
    def equipment_frost_depth_gauges():
        return render_template(
            "equipment_frost_depth_gauges.html",
            title="Поверка мерзлотомеров",
            equipment_type="frost_depth_gauges"
        )

    @app.route("/equipment_grindometers.html")
    @app.route("/equipment/grindometers")
    def equipment_grindometers():
        return render_template(
            "equipment_grindometers.html",
            title="Поверка гриндометров",
            equipment_type="grindometers"
        )

    @app.route("/equipment_normalemeters_multimar.html")
    @app.route("/equipment/normalemeters-multimar")
    def equipment_normalemeters_multimar():
        return render_template(
            "equipment_normalemeters_multimar.html",
            title="Поверка нормалемеров и приборов Multimar 844 T",
            equipment_type="normalemeters_multimar"
        )

    @app.route("/equipment_measuring_wires_rollers.html")
    @app.route("/equipment/measuring-wires-rollers")
    def equipment_measuring_wires_rollers():
        return render_template(
            "equipment_measuring_wires_rollers.html",
            title="Поверка проволочек и роликов",
            equipment_type="measuring_wires_rollers"
        )

    @app.route("/equipment_verification_squares.html")
    @app.route("/equipment/verification-squares")
    def equipment_verification_squares():
        return render_template(
            "equipment_verification_squares.html",
            title="Поверка угольников и приборов для поверки угольников",
            equipment_type="verification_squares"
        )

    @app.route("/equipment_thickness_wall_gauges.html")
    @app.route("/equipment/thickness-wall-gauges")
    def equipment_thickness_wall_gauges():
        return render_template(
            "equipment_thickness_wall_gauges.html",
            title="Поверка толщиномеров и стенкомеров",
            equipment_type="thickness_wall_gauges"
        )

    @app.route("/equipment_medical_stadiometers.html")
    @app.route("/equipment/medical-stadiometers")
    def equipment_medical_stadiometers():
        return render_template(
            "equipment_medical_stadiometers.html",
            title="Поверка медицинских ростомеров",
            equipment_type="medical_stadiometers"
        )

    @app.route("/equipment_height_vertical_length_gauges.html")
    @app.route("/equipment/height-vertical-length-gauges")
    def equipment_height_vertical_length_gauges():
        return render_template(
            "equipment_height_vertical_length_gauges.html",
            title="Поверка высотомеров и вертикальных длиномеров",
            equipment_type="height_vertical_length_gauges"
        )

    @app.route("/equipment_calipers_snap_gauges.html")
    @app.route("/equipment/calipers-snap-gauges")
    def equipment_calipers_snap_gauges():
        return render_template(
            "equipment_calipers_snap_gauges.html",
            title="Поверка кронциркулей и калибров-скоб",
            equipment_type="calipers_snap_gauges"
        )

    @app.route("/equipment_feeler_gauges_wedges.html")
    @app.route("/equipment/feeler-gauges-wedges")
    def equipment_feeler_gauges_wedges():
        return render_template(
            "equipment_feeler_gauges_wedges.html",
            title="Поверка измерительных щупов, клиньев и клиновых высотомеров",
            equipment_type="feeler_gauges_wedges"
        )

    @app.route("/equipment_kipr_connection_gauges.html")
    @app.route("/equipment/kipr-connection-gauges")
    def equipment_kipr_connection_gauges():
        return render_template(
            "equipment_kipr_connection_gauges.html",
            title="Поверка комплектов измерителей присоединительных размеров КИПР",
            equipment_type="kipr_connection_gauges"
        )

    @app.route("/equipment_bearing_clearance_diameter_gauges.html")
    @app.route("/equipment/bearing-clearance-diameter-gauges")
    def equipment_bearing_clearance_diameter_gauges():
        return render_template(
            "equipment_bearing_clearance_diameter_gauges.html",
            title="Поверка приборов для контроля зазора и диаметра подшипников",
            equipment_type="bearing_clearance_diameter_gauges"
        )

    @app.route("/equipment_laboratory_sieves.html")
    @app.route("/equipment/laboratory-sieves")
    def equipment_laboratory_sieves():
        return render_template(
            "equipment_laboratory_sieves.html",
            title="Поверка лабораторных сит",
            equipment_type="laboratory_sieves"
        )

    @app.route("/equipment_measuring_illuminated_magnifiers.html")
    @app.route("/equipment/measuring-illuminated-magnifiers")
    def equipment_measuring_illuminated_magnifiers():
        return render_template(
            "equipment_measuring_illuminated_magnifiers.html",
            title="Поверка измерительных луп и луп с подсветкой",
            equipment_type="measuring_illuminated_magnifiers"
        )

    @app.route("/equipment_control_bars_bk.html")
    @app.route("/equipment/control-bars-bk")
    def equipment_control_bars_bk():
        return render_template(
            "equipment_control_bars_bk.html",
            title="Поверка контрольных брусков БК",
            equipment_type="control_bars_bk"
        )

    @app.route("/equipment_flat_parallel_glass_plates.html")
    @app.route("/equipment/flat-parallel-glass-plates")
    def equipment_flat_parallel_glass_plates():
        return render_template(
            "equipment_flat_parallel_glass_plates.html",
            title="Поверка плоских и плоскопараллельных стеклянных пластин",
            equipment_type="flat_parallel_glass_plates"
        )

    @app.route("/equipment_surface_roughness_samples.html")
    @app.route("/equipment/surface-roughness-samples")
    def equipment_surface_roughness_samples():
        return render_template(
            "equipment_surface_roughness_samples.html",
            title="Поверка образцов шероховатости поверхности",
            equipment_type="surface_roughness_samples"
        )

    @app.route("/equipment_surface_roughness_profilometers.html")
    @app.route("/equipment/surface-roughness-profilometers")
    def equipment_surface_roughness_profilometers():
        return render_template(
            "equipment_surface_roughness_profilometers.html",
            title="Поверка приборов для измерений параметров шероховатости и профилометров",
            equipment_type="surface_roughness_profilometers"
        )

    @app.route("/equipment_microscopes_video_measurement_systems.html")
    @app.route("/equipment/microscopes-video-measurement-systems")
    def equipment_microscopes_video_measurement_systems():
        return render_template(
            "equipment_microscopes_video_measurement_systems.html",
            title="Поверка микроскопов и видеоизмерительных систем",
            equipment_type="microscopes_video_measurement_systems"
        )

    @app.route("/equipment_microstructure_image_analysis_systems.html")
    @app.route("/equipment/microstructure-image-analysis-systems")
    def equipment_microstructure_image_analysis_systems():
        return render_template(
            "equipment_microstructure_image_analysis_systems.html",
            title="Поверка комплексов анализа изображений микроструктуры",
            equipment_type="microstructure_image_analysis_systems"
        )

    @app.route("/equipment_object_micrometers.html")
    @app.route("/equipment/object-micrometers")
    def equipment_object_micrometers():
        return render_template(
            "equipment_object_micrometers.html",
            title="Поверка объект-микрометров",
            equipment_type="object_micrometers"
        )

    @app.route("/equipment_measuring_projectors.html")
    @app.route("/equipment/measuring-projectors")
    def equipment_measuring_projectors():
        return render_template(
            "equipment_measuring_projectors.html",
            title="Поверка измерительных проекторов",
            equipment_type="measuring_projectors"
        )

    @app.route("/equipment_automated_optimeters.html")
    @app.route("/equipment/automated-optimeters")
    def equipment_automated_optimeters():
        return render_template(
            "equipment_automated_optimeters.html",
            title="Поверка автоматизированных оптиметров",
            equipment_type="automated_optimeters"
        )

    @app.route("/equipment_length_measuring_machines_comparators.html")
    @app.route("/equipment/length-measuring-machines-comparators")
    def equipment_length_measuring_machines_comparators():
        return render_template(
            "equipment_length_measuring_machines_comparators.html",
            title="Поверка длиномеров и цифровых компараторов",
            equipment_type="length_measuring_machines_comparators"
        )

    @app.route("/equipment_universal_length_measuring_instruments.html")
    @app.route("/equipment/universal-length-measuring-instruments")
    def equipment_universal_length_measuring_instruments():
        return render_template(
            "equipment_universal_length_measuring_instruments.html",
            title="Поверка универсальных приборов для измерений длины",
            equipment_type="universal_length_measuring_instruments"
        )

    @app.route("/equipment_izm_length_measuring_machines.html")
    @app.route("/equipment/izm-length-measuring-machines")
    def equipment_izm_length_measuring_machines():
        return render_template(
            "equipment_izm_length_measuring_machines.html",
            title="Поверка оптико-механических машин ИЗМ",
            equipment_type="izm_length_measuring_machines"
        )

    @app.route("/equipment_coordinate_measuring_machines.html")
    @app.route("/equipment/coordinate-measuring-machines")
    def equipment_coordinate_measuring_machines():
        return render_template(
            "equipment_coordinate_measuring_machines.html",
            title="Поверка координатно-измерительных машин",
            equipment_type="coordinate_measuring_machines"
        )

    @app.route("/equipment_contact_interferometers.html")
    @app.route("/equipment/contact-interferometers")
    def equipment_contact_interferometers():
        return render_template(
            "equipment_contact_interferometers.html",
            title="Поверка контактных интерферометров",
            equipment_type="contact_interferometers"
        )

    @app.route("/equipment_gauge_block_verification_systems.html")
    @app.route("/equipment/gauge-block-verification-systems")
    def equipment_gauge_block_verification_systems():
        return render_template(
            "equipment_gauge_block_verification_systems.html",
            title="Поверка установок и компараторов для КМД",
            equipment_type="gauge_block_verification_systems"
        )

    @app.route("/equipment_measuring_head_indicator_verification_instruments.html")
    @app.route("/equipment/measuring-head-indicator-verification-instruments")
    def equipment_measuring_head_indicator_verification_instruments():
        return render_template(
            "equipment_measuring_head_indicator_verification_instruments.html",
            title="Поверка приборов для измерительных головок и индикаторов",
            equipment_type="measuring_head_indicator_verification_instruments"
        )

    @app.route("/equipment_pb_runout_testers.html")
    @app.route("/equipment/pb-runout-testers")
    def equipment_pb_runout_testers():
        return render_template(
            "equipment_pb_runout_testers.html",
            title="Поверка биениемеров ПБ",
            equipment_type="pb_runout_testers"
        )

    @app.route("/equipment_deflection_gauges.html")
    @app.route("/equipment/deflection-gauges")
    def equipment_deflection_gauges():
        return render_template(
            "equipment_deflection_gauges.html",
            title="Поверка прогибомеров",
            equipment_type="deflection_gauges"
        )

    @app.route("/equipment_kmf_strain_sensor_calibrators.html")
    @app.route("/equipment/kmf-strain-sensor-calibrators")
    def equipment_kmf_strain_sensor_calibrators():
        return render_template(
            "equipment_kmf_strain_sensor_calibrators.html",
            title="Поверка калибраторов датчиков деформаций KMF",
            equipment_type="kmf_strain_sensor_calibrators"
        )

    @app.route("/equipment_gluten_deformation_meters.html")
    @app.route("/equipment/gluten-deformation-meters")
    def equipment_gluten_deformation_meters():
        return render_template(
            "equipment_gluten_deformation_meters.html",
            title="Поверка измерителей деформации клейковины ИДК",
            equipment_type="gluten_deformation_meters"
        )

    @app.route("/equipment_groove_sensitivity_standards.html")
    @app.route("/equipment/groove-sensitivity-standards")
    def equipment_groove_sensitivity_standards():
        return render_template(
            "equipment_groove_sensitivity_standards.html",
            title="Поверка эталонов чувствительности канавочных",
            equipment_type="groove_sensitivity_standards"
        )

    @app.route("/equipment_kdsk_control_equipment_delivery_complexes.html")
    @app.route("/equipment/kdsk-control-equipment-delivery-complexes")
    def equipment_kdsk_control_equipment_delivery_complexes():
        return render_template(
            "equipment_kdsk_control_equipment_delivery_complexes.html",
            title="Поверка комплекса доставки средств контроля КДСК",
            equipment_type="kdsk_control_equipment_delivery_complexes"
        )

    @app.route("/equipment_holex_chamfer_gauges.html")
    @app.route("/equipment/holex-chamfer-gauges")
    def equipment_holex_chamfer_gauges():
        return render_template(
            "equipment_holex_chamfer_gauges.html",
            title="Поверка шаблонов для фасок Holex",
            equipment_type="holex_chamfer_gauges"
        )

    @app.route("/equipment_welder_and_ndt_inspection_gauges.html")
    @app.route("/equipment/welder-and-ndt-inspection-gauges")
    def equipment_welder_and_ndt_inspection_gauges():
        return render_template(
            "equipment_welder_and_ndt_inspection_gauges.html",
            title="Поверка шаблонов сварщика универсальных и шаблонов специалиста неразрушающего контроля",
            equipment_type="welder_and_ndt_inspection_gauges"
        )

    @app.route("/equipment_cable_and_extended_object_length_measuring_devices.html")
    @app.route("/equipment/cable-and-extended-object-length-measuring-devices")
    def equipment_cable_and_extended_object_length_measuring_devices():
        return render_template(
            "equipment_cable_and_extended_object_length_measuring_devices.html",
            title="Поверка устройств для измерений длины кабеля, материалов и протяженных объектов",
            equipment_type="cable_and_extended_object_length_measuring_devices"
        )

    @app.route("/equipment_scantrack_2000_bulk_material_volume_systems.html")
    @app.route("/equipment/scantrack-2000-bulk-material-volume-systems")
    def equipment_scantrack_2000_bulk_material_volume_systems():
        return render_template(
            "equipment_scantrack_2000_bulk_material_volume_systems.html",
            title="Поверка установок для измерения объема сыпучих материалов СканТрек-2000",
            equipment_type="scantrack_2000_bulk_material_volume_systems"
        )

    @app.route("/equipment_cargo_dimension_measurement_systems.html")
    @app.route("/equipment/cargo-dimension-measurement-systems")
    def equipment_cargo_dimension_measurement_systems():
        return render_template(
            "equipment_cargo_dimension_measurement_systems.html",
            title="Поверка установок для измерений габаритных размеров грузов",
            equipment_type="cargo_dimension_measurement_systems"
        )

    @app.route("/equipment_scantrack_moving_object_geometry_system.html")
    @app.route("/equipment/scantrack-moving-object-geometry-system")
    def equipment_scantrack_moving_object_geometry_system():
        return render_template(
            "equipment_scantrack_moving_object_geometry_system.html",
            title="Поверка установок для измерения геометрических параметров движущихся объектов СканТрек",
            equipment_type="scantrack_moving_object_geometry_system"
        )

    @app.route("/equipment_laser_length_measurement_systems.html")
    @app.route("/equipment/laser-length-measurement-systems")
    def equipment_laser_length_measurement_systems():
        return render_template(
            "equipment_laser_length_measurement_systems.html",
            title="Поверка систем для измерений длины лазерных",
            equipment_type="laser_length_measurement_systems"
        )

    @app.route("/equipment_elcometer_224_surface_profile_gauge.html")
    @app.route("/equipment/elcometer-224-surface-profile-gauge")
    def equipment_elcometer_224_surface_profile_gauge():
        return render_template(
            "equipment_elcometer_224_surface_profile_gauge.html",
            title="Поверка профилемера поверхности цифрового Elcometer 224",
            equipment_type="elcometer_224_surface_profile_gauge"
        )

    @app.route("/equipment_measuring_video_endoscopes.html")
    @app.route("/equipment/measuring-video-endoscopes")
    def equipment_measuring_video_endoscopes():
        return render_template(
            "equipment_measuring_video_endoscopes.html",
            title="Поверка видеоэндоскопов измерительных",
            equipment_type="measuring_video_endoscopes"
        )


    @app.route("/equipment_coating_thickness_measures.html")
    @app.route("/equipment/coating-thickness-measures")
    def equipment_coating_thickness_measures():
        return render_template(
            "equipment_coating_thickness_measures.html",
            title="Поверка мер толщины покрытий",
            equipment_type="coating_thickness_measures"
        )

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

    @app.put("/admin/api/price-items/<int:item_id>")
    def admin_update_price_item(item_id):
        if not is_price_admin():
            return jsonify({"error": "unauthorized"}), 401

        data = request.get_json() or {}
        items = read_price_items()

        for item in items:
            if int(item.get("id", 0)) == item_id:
                item["code"] = data.get("code", "").strip()
                item["section"] = data.get("section", "").strip()
                item["name"] = data.get("name", "").strip()
                item["range"] = data.get("range", "").strip()
                item["verification_price"] = data.get("verification_price", "").strip()
                item["calibration_price"] = data.get("calibration_price", "").strip()
                item["note"] = data.get("note", "").strip()

                if not item["name"]:
                    return jsonify({"error": "name_required"}), 400

                if not item["section"]:
                    return jsonify({"error": "section_required"}), 400

                write_price_items(items)
                return jsonify(item)

        return jsonify({"error": "not_found"}), 404


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