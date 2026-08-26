from PIL import Image, ImageDraw, ImageFont
import textwrap
import math

# =========================
# KONFIGURASI
# =========================
W, H = 1536, 1024
img = Image.new("RGB", (W, H), "white")
draw = ImageDraw.Draw(img)

FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(
        FONT_BOLD if bold else FONT_REGULAR,
        size
    )


def rounded_box(xy, fill, outline=None, radius=16, width=2):
    draw.rounded_rectangle(
        xy,
        radius=radius,
        fill=fill,
        outline=outline,
        width=width
    )


def centered_text(text, box, fnt, fill="black", spacing=4):
    x1, y1, x2, y2 = box
    lines = text.split("\n")

    heights = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt)
        heights.append(bbox[3] - bbox[1])

    total_height = sum(heights) + spacing * (len(lines) - 1)
    y = (y1 + y2 - total_height) / 2

    for line, h in zip(lines, heights):
        bbox = draw.textbbox((0, 0), line, font=fnt)
        text_width = bbox[2] - bbox[0]

        x = (x1 + x2 - text_width) / 2

        draw.text(
            (x, y),
            line,
            font=fnt,
            fill=fill
        )

        y += h + spacing


def arrow(x1, y1, x2, y2):
    draw.line(
        (x1, y1, x2, y2),
        fill="#222222",
        width=4
    )

    angle = math.atan2(
        y2 - y1,
        x2 - x1
    )

    length = 12

    p1 = (
        x2 + length * math.cos(angle + math.pi * 0.85),
        y2 + length * math.sin(angle + math.pi * 0.85)
    )

    p2 = (
        x2 + length * math.cos(angle - math.pi * 0.85),
        y2 + length * math.sin(angle - math.pi * 0.85)
    )

    draw.polygon(
        [(x2, y2), p1, p2],
        fill="#222222"
    )


# =========================
# DATA SOAL
# =========================

panels = [
    {
        "x": 16,
        "title": "1. MENGHITUNG RATA-RATA\nDUA BUAH BILANGAN",

        "theme": "#1267A8",
        "light": "#F2F8FD",

        "known": (
            "Diketahui:\n"
            "• Bilangan 1 = 43\n"
            "• Bilangan 2 = 39\n"
            "• Rumus: Rata ← (Bilangan 1 + Bilangan 2) / 2"
        ),

        "algorithm": (
            "1. Mulai\n"
            "2. Masukkan Bilangan1 = 43\n"
            "3. Masukkan Bilangan2 = 39\n"
            "4. Hitung Rata ← (Bilangan1 + Bilangan2) / 2\n"
            "5. Tampilkan nilai rata-rata\n"
            "6. Selesai"
        ),

        "input": (
            "Bilangan1 ← 43\n"
            "Bilangan2 ← 39"
        ),

        "process": (
            "Rata ← (Bilangan1 + Bilangan2) / 2"
        ),

        "output": (
            "Tampilkan Rata\n"
            "(Rata = 41)"
        ),

        "result": "HASIL:  (43 + 39) / 2  =  41"
    },

    {
        "x": 511,
        "title": "2. MENCARI SISA HASIL BAGI\nDARI PEMBAGIAN DUA BILANGAN BULAT",

        "theme": "#247D3B",
        "light": "#F3FAF4",

        "known": (
            "Diketahui:\n"
            "• Bilangan 1 = 43\n"
            "• Bilangan 2 = 39\n"
            "• Rumus: Sisa ← Bilangan1 MOD Bilangan2"
        ),

        "algorithm": (
            "1. Mulai\n"
            "2. Masukkan Bilangan1 = 43\n"
            "3. Masukkan Bilangan2 = 39\n"
            "4. Hitung Sisa ← Bilangan1 MOD Bilangan2\n"
            "5. Tampilkan nilai sisa\n"
            "6. Selesai"
        ),

        "input": (
            "Bilangan1 ← 43\n"
            "Bilangan2 ← 39"
        ),

        "process": (
            "Sisa ← Bilangan1 MOD Bilangan2"
        ),

        "output": (
            "Tampilkan Sisa\n"
            "(Sisa = 4)"
        ),

        "result": "HASIL:  43 MOD 39  =  4"
    },

    {
        "x": 1006,
        "title": "3. MENGHITUNG TOTAL GAJI BERSIH\nYANG DITERIMA KARYAWAN",

        "theme": "#5D3A98",
        "light": "#F8F5FC",

        "known": (
            "Diketahui:\n"
            "• Gaji Pokok = Rp4.500.000\n"
            "• Bonus = Rp700.000\n"
            "• Rumus: Total Gaji ← Gaji Pokok + Bonus"
        ),

        "algorithm": (
            "1. Mulai\n"
            "2. Masukkan Gaji Pokok = 4.500.000\n"
            "3. Masukkan Bonus = 700.000\n"
            "4. Hitung Total Gaji ← Gaji Pokok + Bonus\n"
            "5. Tampilkan Total Gaji\n"
            "6. Selesai"
        ),

        "input": (
            "Gaji Pokok ← 4.500.000\n"
            "Bonus ← 700.000"
        ),

        "process": (
            "Total Gaji ← Gaji Pokok + Bonus"
        ),

        "output": (
            "Tampilkan Total Gaji\n"
            "(Total Gaji = Rp5.200.000)"
        ),

        "result": (
            "HASIL:  Rp4.500.000 + Rp700.000  =  Rp5.200.000"
        )
    }
]


# =========================
# MEMBUAT PANEL
# =========================

for p in panels:

    x = p["x"]
    x2 = x + 480

    # Panel utama
    draw.rounded_rectangle(
        (x, 12, x2, 1012),
        radius=14,
        fill="white",
        outline=p["theme"],
        width=2
    )

    # Header
    draw.rounded_rectangle(
        (x, 12, x2, 92),
        radius=14,
        fill=p["theme"]
    )

    draw.rectangle(
        (x, 62, x2, 92),
        fill=p["theme"]
    )

    centered_text(
        p["title"],
        (x + 12, 20, x2 - 12, 86),
        font(25, True),
        "white",
        2
    )

    # =========================
    # DIKETAHUI
    # =========================

    rounded_box(
        (x + 14, 106, x2 - 14, 234),
        p["light"],
        p["theme"],
        12,
        2
    )

    draw.text(
        (x + 28, 120),
        "Diketahui:",
        font=font(24, True),
        fill=p["theme"]
    )

    known_text = p["known"].split(":\n", 1)[1]

    centered_text(
        known_text,
        (x + 28, 152, x2 - 28, 220),
        font(18),
        "black",
        5
    )

    # =========================
    # ALGORITMA
    # =========================

    rounded_box(
        (x + 14, 252, x2 - 14, 450),
        "white",
        p["theme"],
        12,
        2
    )

    draw.text(
        (x + 28, 266),
        "ALGORITMA",
        font=font(22, True),
        fill=p["theme"]
    )

    y = 302

    for line in p["algorithm"].splitlines():

        draw.text(
            (x + 28, y),
            line,
            font=font(16),
            fill="black"
        )

        y += 27

    # =========================
    # FLOWCHART TITLE
    # =========================

    centered_text(
        "FLOWCHART",
        (x + 14, 458, x2 - 14, 492),
        font(21, True),
        p["theme"]
    )

    cx = (x + x2) // 2

    # =========================
    # MULAI
    # =========================

    rounded_box(
        (cx - 80, 500, cx + 80, 544),
        "#EAF7E6",
        "#2E7D32",
        22,
        2
    )

    centered_text(
        "MULAI",
        (cx - 80, 500, cx + 80, 544),
        font(17),
        "black"
    )

    arrow(cx, 544, cx, 562)

    # =========================
    # INPUT
    # =========================

    draw.polygon(
        [
            (cx - 110, 562),
            (cx + 110, 562),
            (cx + 95, 616),
            (cx - 125, 616)
        ],
        fill="#EAF3FB",
        outline="#1769AA"
    )

    centered_text(
        p["input"],
        (cx - 120, 568, cx + 120, 610),
        font(15),
        "black",
        2
    )

    arrow(cx, 616, cx, 634)

    # =========================
    # PROSES
    # =========================

    rounded_box(
        (cx - 135, 634, cx + 135, 690),
        "#FFF6D9",
        "#E0A400",
        8,
        2
    )

    centered_text(
        p["process"],
        (cx - 128, 638, cx + 128, 686),
        font(14),
        "black"
    )

    arrow(cx, 690, cx, 708)

    # =========================
    # OUTPUT
    # =========================

    draw.polygon(
        [
            (cx - 115, 708),
            (cx + 115, 708),
            (cx + 100, 766),
            (cx - 130, 766)
        ],
        fill="#FCE7EF",
        outline="#D81B60"
    )

    centered_text(
        p["output"],
        (cx - 125, 713, cx + 125, 762),
        font(14),
        "black",
        2
    )

    arrow(cx, 766, cx, 786)

    # =========================
    # SELESAI
    # =========================

    rounded_box(
        (cx - 80, 786, cx + 80, 830),
        "#EAF7E6",
        "#2E7D32",
        22,
        2
    )

    centered_text(
        "SELESAI",
        (cx - 80, 786, cx + 80, 830),
        font(17),
        "black"
    )

    # =========================
    # HASIL
    # =========================

    rounded_box(
        (x + 70, 884, x2 - 70, 930),
        "white",
        p["theme"],
        7,
        2
    )

    centered_text(
        p["result"],
        (x + 80, 890, x2 - 80, 924),
        font(14, True),
        p["theme"]
    )


# =========================
# SIMPAN GAMBAR
# =========================

output_file = "algoritma_flowchart_3_soal.png"

img.save(
    output_file,
    "PNG"
)

print(f"Gambar berhasil dibuat: {output_file}")