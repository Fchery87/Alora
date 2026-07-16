#!/usr/bin/env python3
"""Stitch Alora prototype screenshots into labelled contact sheets."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

TILE_W = 340
PAD = 22
LABEL_H = 34
BG = (227, 217, 201)          # warm linen, matches the app stage
CARD = (245, 238, 228)
INK = (42, 36, 32)
SOFT = (122, 108, 92)

f_label = ImageFont.truetype(FONT_BOLD, 19)
f_sub = ImageFont.truetype(FONT_REG, 15)
f_title = ImageFont.truetype(FONT_BOLD, 34)


def make_sheet(items, cols, outpath, title):
    # probe tile height from first image
    sample = Image.open(os.path.join(SHOTS, items[0][0]))
    tile_h = round(sample.height * TILE_W / sample.width)
    cell_w = TILE_W + PAD
    cell_h = TILE_W and (tile_h + LABEL_H + PAD)
    rows = (len(items) + cols - 1) // cols

    title_h = 86
    W = cols * cell_w + PAD
    H = title_h + rows * cell_h + PAD

    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((PAD + 6, 28), title, font=f_title, fill=INK)

    for idx, (fname, label) in enumerate(items):
        r, c = divmod(idx, cols)
        x = PAD + c * cell_w
        y = title_h + r * cell_h
        img = Image.open(os.path.join(SHOTS, fname)).convert("RGB")
        img = img.resize((TILE_W, tile_h), Image.LANCZOS)
        # soft card behind the phone shot
        d.rounded_rectangle([x - 6, y - 6, x + TILE_W + 6, y + tile_h + LABEL_H + 6],
                            radius=18, fill=CARD)
        sheet.paste(img, (x, y))
        name, _, theme = label.partition("·")
        d.text((x + 4, y + tile_h + 8), name.strip(), font=f_label, fill=INK)
        if theme:
            tw = d.textlength(name.strip(), font=f_label)
            d.text((x + 12 + tw, y + tile_h + 11), theme.strip(), font=f_sub, fill=SOFT)

    sheet.save(outpath)
    print(f"wrote {outpath}  ({W}x{H}, {len(items)} tiles)")


core = []
for theme in ("dawn", "night"):
    for s, nm in [("home", "Home"), ("log", "Log"), ("timeline", "Timeline"),
                  ("checkin", "Check-In"), ("settings", "Settings"),
                  ("onboarding", "Onboarding"), ("invite", "Invite"), ("delete", "Delete")]:
        core.append((f"{s}-{theme}.png", f"{nm} · {theme.title()}"))

make_sheet(core, 4, os.path.join(SHOTS, "_contact-sheet.png"),
           "Alora · Quiet Dawn — all screens, both themes")

extras = [
    ("trust-dawn.png", "Trust center · Dawn"),
    ("reminders-dawn.png", "Reminders · Dawn"),
    ("trust-night.png", "Trust center · Night"),
    ("reminders-night.png", "Reminders · Night"),
]
make_sheet(extras, 4, os.path.join(SHOTS, "_contact-sheet-extras.png"),
           "Alora · New Settings detail screens")

states = [
    ("state-timeline-loading.png", "Timeline · loading"),
    ("state-timeline-empty.png", "Timeline · empty"),
    ("state-timeline-error.png", "Timeline · error"),
    ("state-home-loading.png", "Home · loading"),
    ("state-merge.png", "Merge duplicate"),
    ("state-checkin-mood.png", "Mood selected"),
    ("state-delete-holding.png", "Hold-to-delete"),
    ("state-onboarding-privacy.png", "Onboarding · privacy"),
]
make_sheet(states, 4, os.path.join(SHOTS, "_contact-sheet-states.png"),
           "Alora · States + interactions (async, empty, error, merge)")
