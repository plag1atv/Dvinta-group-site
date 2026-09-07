from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = PROJECT_ROOT / "app" / "static" / "img"


def optimize_png(filename: str, max_size: int) -> None:
    image_path = IMAGE_DIR / filename

    with Image.open(image_path) as source:
        image = source.convert("RGBA")

        image.thumbnail(
            (max_size, max_size),
            Image.Resampling.LANCZOS,
        )

        image.save(
            image_path,
            format="PNG",
            optimize=True,
            compress_level=9,
        )

    size_kb = image_path.stat().st_size / 1024

    print(
        f"{filename}: "
        f"{image.width}x{image.height}, "
        f"{size_kb:.1f} KB"
    )


optimize_png(
    "dvinta_mark_256.png",
    256,
)

optimize_png(
    "scroll-seal.png",
    384,
)

print("Готово.")