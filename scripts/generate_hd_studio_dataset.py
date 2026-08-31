"""
SignBridge AI - Studio-Grade High-Definition ISL Asset Generator
Renders recognizable, filled anatomical hand silhouettes (palm + fingers)
with overlaid glowing MediaPipe 3D skeletal tracking joints and HUD typography.
Generates all 68 standard sign assets (26 Alphabets, 10 Digits, 16 Phrases).
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIGNS_DIR = os.path.join(BASE_DIR, "frontend", "src", "assets", "signs")
ALPHABET_DIR = os.path.join(SIGNS_DIR, "alphabet")
DIGITS_DIR = os.path.join(SIGNS_DIR, "digits")

# 21 MediaPipe hand landmark keypoint templates for standard ISL poses
HAND_LANDMARK_CONFIGS = {
    # Alphabets
    "A": {"thumb": "side_up", "index": "fist", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "B": {"thumb": "in", "index": "up", "middle": "up", "ring": "up", "pinky": "up", "accent": "#a855f7"},
    "C": {"thumb": "curve", "index": "curve", "middle": "curve", "ring": "curve", "pinky": "curve", "accent": "#a855f7"},
    "D": {"thumb": "ring_pinch", "index": "up", "middle": "curve_in", "ring": "curve_in", "pinky": "curve_in", "accent": "#a855f7"},
    "E": {"thumb": "bottom_in", "index": "curl", "middle": "curl", "ring": "curl", "pinky": "curl", "accent": "#a855f7"},
    "F": {"thumb": "index_pinch", "index": "pinch", "middle": "up", "ring": "up", "pinky": "up", "accent": "#a855f7"},
    "G": {"thumb": "horizontal", "index": "horizontal", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "H": {"thumb": "side", "index": "horizontal", "middle": "horizontal", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "I": {"thumb": "in", "index": "fist", "middle": "fist", "ring": "fist", "pinky": "up", "accent": "#a855f7"},
    "J": {"thumb": "in", "index": "fist", "middle": "fist", "ring": "fist", "pinky": "hook", "accent": "#a855f7"},
    "K": {"thumb": "between", "index": "up", "middle": "diagonal", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "L": {"thumb": "spread_out", "index": "up", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "M": {"thumb": "tucked_under_3", "index": "folded_over", "middle": "folded_over", "ring": "folded_over", "pinky": "fist", "accent": "#a855f7"},
    "N": {"thumb": "tucked_under_2", "index": "folded_over", "middle": "folded_over", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "O": {"thumb": "pinch_all", "index": "curve_pinch", "middle": "curve_pinch", "ring": "curve_pinch", "pinky": "curve_pinch", "accent": "#a855f7"},
    "P": {"thumb": "down_between", "index": "down_horizontal", "middle": "down_diagonal", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "Q": {"thumb": "down", "index": "down", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "R": {"thumb": "in", "index": "crossed_over", "middle": "crossed_under", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "S": {"thumb": "over_fist", "index": "tight_fist", "middle": "tight_fist", "ring": "tight_fist", "pinky": "tight_fist", "accent": "#a855f7"},
    "T": {"thumb": "between_1", "index": "curled_over", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "U": {"thumb": "in", "index": "up_together", "middle": "up_together", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "V": {"thumb": "in", "index": "up_spread_left", "middle": "up_spread_right", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "W": {"thumb": "in", "index": "up_spread_left", "middle": "up_straight", "ring": "up_spread_right", "pinky": "fist", "accent": "#a855f7"},
    "X": {"thumb": "in", "index": "hooked", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},
    "Y": {"thumb": "spread_left", "index": "fist", "middle": "fist", "ring": "fist", "pinky": "spread_right", "accent": "#a855f7"},
    "Z": {"thumb": "in", "index": "trace_z", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#a855f7"},

    # Digits
    "0": {"thumb": "curve", "index": "curve", "middle": "curve", "ring": "curve", "pinky": "curve", "accent": "#f6ac3f"},
    "1": {"thumb": "in", "index": "up", "middle": "fist", "ring": "fist", "pinky": "fist", "accent": "#f6ac3f"},
    "2": {"thumb": "in", "index": "up_spread_left", "middle": "up_spread_right", "ring": "fist", "pinky": "fist", "accent": "#f6ac3f"},
    "3": {"thumb": "hold_pinky", "index": "up_spread_left", "middle": "up_straight", "ring": "up_spread_right", "pinky": "fist", "accent": "#f6ac3f"},
    "4": {"thumb": "in", "index": "up", "middle": "up", "ring": "up", "pinky": "up", "accent": "#f6ac3f"},
    "5": {"thumb": "spread_out", "index": "up_spread_left", "middle": "up_straight", "ring": "up", "pinky": "spread_right", "accent": "#f6ac3f"},
    "6": {"thumb": "touch_pinky", "index": "up", "middle": "up", "ring": "up", "pinky": "curve_in", "accent": "#f6ac3f"},
    "7": {"thumb": "touch_ring", "index": "up", "middle": "up", "ring": "curve_in", "pinky": "up", "accent": "#f6ac3f"},
    "8": {"thumb": "touch_middle", "index": "up", "middle": "curve_in", "ring": "up", "pinky": "up", "accent": "#f6ac3f"},
    "9": {"thumb": "touch_index", "index": "curve_in", "middle": "up", "ring": "up", "pinky": "up", "accent": "#f6ac3f"}
}

PHRASE_CONFIGS = {
    "HELLO": {"start": "B", "end": "B", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "HELLO"},
    "THANK_YOU": {"start": "B", "end": "B", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "THANK YOU"},
    "PLEASE": {"start": "B", "end": "B", "start_accent": "#f6ac3f", "end_accent": "#f6ac3f", "name": "PLEASE"},
    "YES": {"start": "A", "end": "S", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "YES"},
    "NO": {"start": "N", "end": "N", "start_accent": "#ff6a5b", "end_accent": "#ff6a5b", "name": "NO"},
    "SORRY": {"start": "A", "end": "S", "start_accent": "#ff6a5b", "end_accent": "#ff6a5b", "name": "SORRY"},
    "I": {"start": "I", "end": "I", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "I"},
    "WANT": {"start": "B", "end": "C", "start_accent": "#f6ac3f", "end_accent": "#f6ac3f", "name": "WANT"},
    "WATER": {"start": "W", "end": "W", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "WATER"},
    "FOOD": {"start": "O", "end": "O", "start_accent": "#f6ac3f", "end_accent": "#f6ac3f", "name": "FOOD"},
    "HELP": {"start": "B", "end": "A", "start_accent": "#ff6a5b", "end_accent": "#ff6a5b", "name": "HELP"},
    "STOP": {"start": "B", "end": "S", "start_accent": "#ff6a5b", "end_accent": "#ff6a5b", "name": "STOP"},
    "FRIEND": {"start": "G", "end": "F", "start_accent": "#f6ac3f", "end_accent": "#f6ac3f", "name": "FRIEND"},
    "NAME": {"start": "N", "end": "N", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "NAME"},
    "TIME": {"start": "I", "end": "T", "start_accent": "#f6ac3f", "end_accent": "#f6ac3f", "name": "TIME"},
    "GOOD": {"start": "A", "end": "G", "start_accent": "#2dd6c0", "end_accent": "#2dd6c0", "name": "GOOD"}
}


def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))


def draw_capsule(draw, p1, p2, radius, fill_color, outline_color=None):
    """Draws a smooth rounded anatomical finger segment capsule between p1 and p2."""
    p1 = tuple(p1)
    p2 = tuple(p2)
    # Line body
    draw.line([p1, p2], fill=fill_color, width=int(radius * 2))
    # Round caps
    r = int(radius)
    draw.ellipse([p1[0] - r, p1[1] - r, p1[0] + r, p1[1] + r], fill=fill_color, outline=outline_color)
    draw.ellipse([p2[0] - r, p2[1] - r, p2[0] + r, p2[1] + r], fill=fill_color, outline=outline_color)


def generate_hand_diagram(sign_code, config, size=(800, 800), subtitle=None):
    """
    Renders a clear, recognizable filled human hand silhouette with skin tone shading,
    overlaid with luminous MediaPipe tracking keypoints and HUD elements.
    """
    w, h = size
    img = Image.new('RGB', (w, h), color=(14, 16, 24))
    draw = ImageDraw.Draw(img)

    # 1. Studio Dark Radial Gradient Background
    cx, cy = w // 2, h // 2
    for r in range(max(w, h), 0, -12):
        factor = r / max(w, h)
        # Deep charcoal slate gradient
        c_val = (
            int(12 + 18 * factor),
            int(14 + 20 * factor),
            int(22 + 30 * factor)
        )
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c_val)

    # Subtle accent ambient glow in background
    accent_rgb = hex_to_rgb(config.get('accent', '#2dd6c0'))
    glow_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_overlay)
    glow_radius = int(w * 0.40)
    for gr in range(glow_radius, 0, -10):
        alpha = int((1 - gr / glow_radius) * 45)
        glow_draw.ellipse(
            [cx - gr, cy - gr - 30, cx + gr, cy + gr - 30],
            fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], alpha)
        )
    img.paste(glow_overlay, (0, 0), glow_overlay)
    draw = ImageDraw.Draw(img)

    # 2. Compute 21 Hand Landmark Coordinates
    wrist = np.array([w * 0.50, h * 0.82])
    wrist_left = np.array([w * 0.40, h * 0.98])
    wrist_right = np.array([w * 0.60, h * 0.98])
    
    thumb_cmc = np.array([w * 0.38, h * 0.74])
    thumb_mcp = np.array([w * 0.32, h * 0.64])
    
    index_mcp = np.array([w * 0.39, h * 0.53])
    middle_mcp = np.array([w * 0.49, h * 0.51])
    ring_mcp = np.array([w * 0.59, h * 0.54])
    pinky_mcp = np.array([w * 0.67, h * 0.59])

    # Dynamic Finger Vectors
    def get_finger_points(mcp, length, angle_deg, is_fist=False, is_curve=False, is_pinch=False):
        rad = math.radians(angle_deg)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        
        if is_fist:
            pip = mcp + np.array([-sin_a * length * 0.30, -cos_a * length * 0.30])
            dip = pip + np.array([10, length * 0.30])
            tip = dip + np.array([0, length * 0.25])
        elif is_curve:
            pip = mcp + np.array([-sin_a * length * 0.38, -cos_a * length * 0.38])
            dip = pip + np.array([-sin_a * length * 0.30 - 20, -cos_a * length * 0.15])
            tip = dip + np.array([-25, length * 0.25])
        elif is_pinch:
            pip = mcp + np.array([-sin_a * length * 0.35, -cos_a * length * 0.35])
            dip = pip + np.array([-15, 10])
            tip = np.array([w * 0.45, h * 0.56])
        else: # Straight / extended
            pip = mcp + np.array([-sin_a * length * 0.38, -cos_a * length * 0.38])
            dip = pip + np.array([-sin_a * length * 0.32, -cos_a * length * 0.32])
            tip = dip + np.array([-sin_a * length * 0.30, -cos_a * length * 0.30])
            
        return [pip, dip, tip]

    idx_state = config.get('index', 'up')
    mid_state = config.get('middle', 'up')
    rng_state = config.get('ring', 'up')
    pky_state = config.get('pinky', 'up')
    thb_state = config.get('thumb', 'in')

    # Thumb positions
    if thb_state in ['side_up', 'spread_out', 'spread_left']:
        thumb_ip = thumb_mcp + np.array([-70, -45])
        thumb_tip = thumb_ip + np.array([-55, -45])
    elif thb_state in ['curve', 'pinch', 'ring_pinch', 'index_pinch', 'touch_index']:
        thumb_ip = thumb_mcp + np.array([20, -55])
        thumb_tip = np.array([w * 0.44, h * 0.54])
    else: # In / across fist
        thumb_ip = thumb_mcp + np.array([30, -40])
        thumb_tip = thumb_ip + np.array([35, -15])

    index_pts = get_finger_points(index_mcp, 180, -8 if 'spread' in idx_state or 'left' in idx_state else -2, 'fist' in idx_state or 'curl' in idx_state, 'curve' in idx_state, 'pinch' in idx_state)
    middle_pts = get_finger_points(middle_mcp, 195, 0 if 'straight' in mid_state else 2, 'fist' in mid_state or 'curl' in mid_state, 'curve' in mid_state, 'pinch' in mid_state)
    ring_pts = get_finger_points(ring_mcp, 180, 10 if 'spread' in rng_state or 'right' in rng_state else 4, 'fist' in rng_state or 'curl' in rng_state, 'curve' in rng_state, 'pinch' in rng_state)
    pinky_pts = get_finger_points(pinky_mcp, 155, 22 if 'spread' in pky_state or 'right' in pky_state else 12, 'fist' in pky_state or 'curl' in pky_state, 'curve' in pky_state, 'pinch' in pky_state)

    # 3. Render Solid Anatomical Hand Silhouette (Palm + 5 Fingers)
    # Hand Palette (Stylized warm illuminated hand tone with dark rim contour)
    skin_base = (185, 145, 125, 240)
    skin_highlight = (220, 180, 160, 240)
    skin_shadow = (140, 100, 85, 255)
    skin_rim = (85, 60, 50, 255)

    hand_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(hand_layer)

    # Forearm / Wrist Base
    forearm_poly = [
        tuple(wrist_left),
        tuple(wrist_right),
        tuple(pinky_mcp + np.array([15, 40])),
        tuple(wrist),
        tuple(thumb_cmc + np.array([-15, 20]))
    ]
    hdraw.polygon(forearm_poly, fill=skin_shadow, outline=skin_rim)

    # Palm Mass (Anatomical multi-point polygon + knuckle cushions)
    palm_poly = [
        tuple(wrist),
        tuple(thumb_cmc),
        tuple(thumb_mcp),
        tuple(index_mcp + np.array([-10, -5])),
        tuple(index_mcp + np.array([0, -15])),
        tuple(middle_mcp + np.array([0, -18])),
        tuple(ring_mcp + np.array([0, -15])),
        tuple(pinky_mcp + np.array([10, -10])),
        tuple(pinky_mcp + np.array([18, 15])),
        tuple(wrist + np.array([25, 0]))
    ]
    hdraw.polygon(palm_poly, fill=skin_base, outline=skin_rim)
    
    # Palm Center Highlight / Depth Volume
    hdraw.ellipse([w * 0.38, h * 0.55, w * 0.62, h * 0.75], fill=skin_highlight)

    # Draw 5 Fingers as Thick Anatomical Segments with Knuckle Rounding
    fingers = [
        # Thumb
        ([thumb_cmc, thumb_mcp, thumb_ip, thumb_tip], [28, 25, 22]),
        # Pinky
        ([pinky_mcp] + pinky_pts, [22, 20, 17]),
        # Ring
        ([ring_mcp] + ring_pts, [25, 22, 19]),
        # Middle
        ([middle_mcp] + middle_pts, [26, 23, 20]),
        # Index
        ([index_mcp] + index_pts, [25, 22, 19])
    ]

    for pts, radii in fingers:
        for i in range(len(pts) - 1):
            p_start = pts[i]
            p_end = pts[i + 1]
            r = radii[i]
            # Outer shadow / rim
            draw_capsule(hdraw, p_start, p_end, r + 2, skin_shadow)
            # Main skin body
            draw_capsule(hdraw, p_start, p_end, r, skin_base)
            # Inner volumetric highlight
            highlight_start = p_start + np.array([-2, -2])
            highlight_end = p_end + np.array([-2, -2])
            draw_capsule(hdraw, highlight_start, highlight_end, max(2, r - 8), skin_highlight)

    # Paste Hand Silhouette Layer onto main image
    img.paste(hand_layer, (0, 0), hand_layer)
    draw = ImageDraw.Draw(img)

    # 4. Draw Overlaid MediaPipe Skeletal Bones (Illuminated tubes)
    chains = [
        [wrist, thumb_cmc, thumb_mcp, thumb_ip, thumb_tip],
        [wrist, index_mcp] + index_pts,
        [wrist, middle_mcp] + middle_pts,
        [wrist, ring_mcp] + ring_pts,
        [wrist, pinky_mcp] + pinky_pts,
        [index_mcp, middle_mcp, ring_mcp, pinky_mcp]
    ]

    # Glow layer for bones
    glow_line_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow_line_draw = ImageDraw.Draw(glow_line_layer)
    for chain in chains:
        pts = [tuple(p) for p in chain]
        glow_line_draw.line(pts, fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], 120), width=12, joint='round')
    
    glow_line_blurred = glow_line_layer.filter(ImageFilter.GaussianBlur(radius=4))
    img.paste(glow_line_blurred, (0, 0), glow_line_blurred)

    # Crisp sharp central bone lines
    draw = ImageDraw.Draw(img)
    for chain in chains:
        pts = [tuple(p) for p in chain]
        draw.line(pts, fill=(255, 255, 255), width=4, joint='round')

    # 5. Draw Glowing MediaPipe Joint Nodes (21 Keypoints)
    all_nodes = [
        wrist, thumb_cmc, thumb_mcp, thumb_ip, thumb_tip,
        index_mcp, index_pts[0], index_pts[1], index_pts[2],
        middle_mcp, middle_pts[0], middle_pts[1], middle_pts[2],
        ring_mcp, ring_pts[0], ring_pts[1], ring_pts[2],
        pinky_mcp, pinky_pts[0], pinky_pts[1], pinky_pts[2]
    ]

    for idx, node in enumerate(all_nodes):
        nx, ny = node
        is_tip = idx in [4, 8, 12, 16, 20]
        r_node = 11 if is_tip else 7
        
        # Outer luminous colored halo
        draw.ellipse([nx - r_node - 4, ny - r_node - 4, nx + r_node + 4, ny + r_node + 4], fill=accent_rgb)
        # Crisp white core
        draw.ellipse([nx - r_node, ny - r_node, nx + r_node, ny + r_node], fill=(255, 255, 255))
        if is_tip:
            draw.ellipse([nx - 4, ny - 4, nx + 4, ny + 4], fill=accent_rgb)

    # 6. Corner Viewport HUD Brackets
    bracket_color = accent_rgb
    b_len = 36
    margin = 28
    
    draw.line([(margin, margin), (margin + b_len, margin)], fill=bracket_color, width=3)
    draw.line([(margin, margin), (margin, margin + b_len)], fill=bracket_color, width=3)
    draw.line([(w - margin, margin), (w - margin - b_len, margin)], fill=bracket_color, width=3)
    draw.line([(w - margin, margin), (w - margin, margin + b_len)], fill=bracket_color, width=3)
    draw.line([(margin, h - margin), (margin + b_len, h - margin)], fill=bracket_color, width=3)
    draw.line([(margin, h - margin), (margin, h - margin - b_len)], fill=bracket_color, width=3)
    draw.line([(w - margin, h - margin), (w - margin - b_len, h - margin)], fill=bracket_color, width=3)
    draw.line([(w - margin, h - margin), (w - margin, h - margin - b_len)], fill=bracket_color, width=3)

    # 7. Prominent Sign Showcase Typography
    draw.rectangle([margin + 12, margin + 12, margin + 210, margin + 88], fill=(14, 16, 24), outline=accent_rgb, width=2)
    try:
        font_large = ImageFont.truetype("arialbd.ttf", 40)
        font_sub = ImageFont.truetype("arial.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    draw.text((margin + 24, margin + 20), sign_code, fill=(255, 255, 255), font=font_large)
    sub_text = subtitle if subtitle else "ISL STANDARD"
    draw.text((margin + 24, margin + 62), sub_text, fill=accent_rgb, font=font_sub)

    return img


def generate_all_hd_assets():
    os.makedirs(ALPHABET_DIR, exist_ok=True)
    os.makedirs(DIGITS_DIR, exist_ok=True)

    print("\n=======================================================")
    print("  SignBridge AI - High-Definition Studio Asset Engine")
    print("  Generating Filled Hand Silhouettes + MediaPipe Joints")
    print("=======================================================\n")

    # 1. Generate 26 Letters (A-Z)
    print("--- [1/3] Generating A–Z Hand Demonstration Images ---")
    for i in range(ord('A'), ord('Z') + 1):
        letter = chr(i)
        config = HAND_LANDMARK_CONFIGS.get(letter, {"thumb": "in", "index": "up", "middle": "up", "ring": "up", "pinky": "up", "accent": "#a855f7"})
        img = generate_hand_diagram(letter, config, size=(800, 800), subtitle=f"LETTER '{letter}'")
        out_path = os.path.join(ALPHABET_DIR, f"{letter}.jpg")
        img.save(out_path, "JPEG", quality=96)
        print(f"  [OK] Letter '{letter}' -> Rendered filled hand in alphabet/{letter}.jpg")

    # 2. Generate 10 Digits (0-9)
    print("\n--- [2/3] Generating 0–9 Counting Demonstration Images ---")
    for digit, config in [(str(d), HAND_LANDMARK_CONFIGS.get(str(d))) for d in range(10)]:
        img = generate_hand_diagram(digit, config, size=(800, 800), subtitle=f"DIGIT '{digit}'")
        out_path = os.path.join(DIGITS_DIR, f"{digit}.jpg")
        img.save(out_path, "JPEG", quality=96)
        print(f"  [OK] Digit '{digit}' -> Rendered filled hand in digits/{digit}.jpg")

    # 3. Generate 16 Phrases (Start & End)
    print("\n--- [3/3] Generating Phrase Gesture Demonstrations ---")
    for word_key, pconfig in PHRASE_CONFIGS.items():
        word_dir = os.path.join(SIGNS_DIR, word_key)
        os.makedirs(word_dir, exist_ok=True)

        start_cfg = HAND_LANDMARK_CONFIGS.get(pconfig["start"], {"accent": pconfig["start_accent"]})
        start_cfg["accent"] = pconfig["start_accent"]
        start_img = generate_hand_diagram(pconfig["name"], start_cfg, size=(800, 800), subtitle="START POSITION")

        end_cfg = HAND_LANDMARK_CONFIGS.get(pconfig["end"], {"accent": pconfig["end_accent"]})
        end_cfg["accent"] = pconfig["end_accent"]
        end_img = generate_hand_diagram(pconfig["name"], end_cfg, size=(800, 800), subtitle="END POSITION")

        start_img.save(os.path.join(word_dir, "start.jpg"), "JPEG", quality=96)
        end_img.save(os.path.join(word_dir, "end.jpg"), "JPEG", quality=96)
        print(f"  [OK] Phrase '{pconfig['name']:<10}' -> Rendered filled hand start.jpg & end.jpg")

    print("\n=======================================================")
    print(f"[Success] All 68 Filled Hand Demonstration Images Created in:\n  {SIGNS_DIR}")
    print("=======================================================\n")


if __name__ == "__main__":
    generate_all_hd_assets()
