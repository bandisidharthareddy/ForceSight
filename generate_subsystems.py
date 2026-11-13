import math
from PIL import Image, ImageDraw, ImageFont

W, H = 800, 1000

def create_base(title_tag, title_main, subtitle):
    img = Image.new('RGB', (W, H), color=(11, 15, 23))
    draw = ImageDraw.Draw(img)
    
    # Grid background lines
    for x in range(0, W, 40):
        draw.line([(x, 0), (x, H)], fill=(20, 27, 40), width=1)
    for y in range(0, H, 40):
        draw.line([(0, y), (W, y)], fill=(20, 27, 40), width=1)
        
    # Top HUD header
    draw.rectangle([(20, 20), (W-20, 80)], fill=(16, 22, 34), outline=(40, 55, 80))
    draw.text((40, 32), f"FORCESIGHT SYSTEM // {title_tag}", fill=(56, 189, 248))
    draw.text((40, 52), title_main.upper(), fill=(245, 242, 235))
    
    # Bottom HUD panel
    draw.rectangle([(20, H-120), (W-20, H-20)], fill=(16, 22, 34), outline=(40, 55, 80))
    draw.text((40, H-105), "SPECIFICATION & SCHEMATIC TELEMETRY", fill=(148, 163, 184))
    draw.text((40, H-80), subtitle, fill=(56, 189, 248))
    draw.text((40, H-55), "CALIBRATION STATUS: VERIFIED 2026 // MIL-STD-810H", fill=(16, 185, 129))
    
    return img, draw

# 1. Piston Testing Frame (Mechanical screw actuator, load frame)
def gen_piston():
    img, draw = create_base("HW-01", "Precision Mechanical Load Frame", "5.0 kN LEAD-SCREW COMPRESSION ACTUATOR")
    
    # Outer frame columns
    draw.rectangle([(160, 120), (220, 780)], fill=(30, 41, 59), outline=(71, 85, 105), width=2)
    draw.rectangle([(580, 120), (640, 780)], fill=(30, 41, 59), outline=(71, 85, 105), width=2)
    
    # Top Crosshead
    draw.rectangle([(130, 120), (670, 200)], fill=(51, 65, 85), outline=(100, 116, 139), width=3)
    draw.text((250, 150), "STEEL REACTION CROSSHEAD", fill=(241, 245, 249))
    
    # Base reaction slab
    draw.rectangle([(120, 720), (680, 820)], fill=(51, 65, 85), outline=(100, 116, 139), width=3)
    draw.text((260, 760), "SOLID ANCHOR BED [0-5000 N]", fill=(241, 245, 249))
    
    # Center lead-screw rod
    for y in range(210, 520, 12):
        draw.line([(385, y), (415, y+6)], fill=(148, 163, 184), width=3)
    draw.rectangle([(380, 200), (420, 530)], outline=(148, 163, 184), width=2)
    
    # Moving Piston Ram
    draw.rectangle([(260, 480), (540, 560)], fill=(56, 189, 248), outline=(255, 255, 255), width=3)
    draw.text((290, 510), "LINEAR PISTON RAM // 5.0 kN", fill=(11, 15, 23))
    
    # Hydraulic / Mechanical Force Arrows
    for arr_x in [300, 400, 500]:
        draw.line([(arr_x, 570), (arr_x, 660)], fill=(239, 68, 68), width=4)
        draw.polygon([(arr_x-8, 655), (arr_x+8, 655), (arr_x, 675)], fill=(239, 68, 68))
        
    # Specimen under compression
    draw.rectangle([(310, 670), (490, 720)], fill=(245, 158, 11), outline=(255, 255, 255), width=2)
    draw.text((330, 690), "CROWD BARRIER SPECIMEN", fill=(0, 0, 0))
    
    img.save("public/subsystems/piston_frame.png")

# 2. Multi-Axis Load Cell Telemetry
def gen_loadcell():
    img, draw = create_base("TEL-02", "Multi-Axis Load Cell Telemetry", "100 Hz STRAIN-GAUGE BRIDGE ARRAY")
    
    # Load cell body (cylindrical canister)
    draw.ellipse([(260, 220), (540, 360)], fill=(51, 65, 85), outline=(56, 189, 248), width=3)
    draw.rectangle([(260, 290), (540, 560)], fill=(30, 41, 59), outline=(56, 189, 248), width=3)
    draw.ellipse([(260, 490), (540, 630)], fill=(15, 23, 42), outline=(56, 189, 248), width=3)
    
    # Strain gauge rosettes on cylinder surface
    draw.rectangle([(340, 380), (460, 470)], fill=(15, 23, 42), outline=(245, 158, 11), width=2)
    for gy in range(390, 460, 8):
        draw.line([(350, gy), (450, gy)], fill=(239, 68, 68), width=2)
    draw.text((360, 420), "STRAIN ROSETTE", fill=(255, 255, 255))
    
    # Telemetry Signal Sine Wave
    prev_pt = (100, 720)
    for x in range(100, 700, 10):
        y = 720 + math.sin(x * 0.05) * 35
        draw.line([prev_pt, (x, y)], fill=(56, 189, 248), width=3)
        prev_pt = (x, y)
    draw.text((120, 660), "REAL-TIME TELEMETRY STREAM: 100 Hz SAMPLE RATE // [Fx, Fy, Fz]", fill=(56, 189, 248))
    
    img.save("public/subsystems/load_cell.png")

# 3. Photoelastic Stress Optics (Birefringence rings)
def gen_photoelastic():
    img, draw = create_base("OPT-03", "Photoelastic Stress Optics", "MICHEL-LEVY CHROMATIC FRINGE INTERFERENCE")
    
    # Concentric colorful photoelastic stress fringe rings
    colors = [
        (239, 68, 68),   # Crimson red
        (245, 158, 11),  # Amber
        (250, 204, 21),  # Yellow
        (16, 185, 129),  # Emerald
        (56, 189, 248),  # Cyan
        (99, 102, 241),  # Indigo
    ]
    
    center_x, center_y = 400, 460
    for r in range(240, 30, -32):
        c_idx = (r // 32) % len(colors)
        col = colors[c_idx]
        draw.ellipse([(center_x - r, center_y - r), (center_x + r, center_y + r)], outline=col, width=6)
        
    # Polarizer crosshairs
    draw.line([(center_x, 150), (center_x, 770)], fill=(255, 255, 255), width=2)
    draw.line([(90, center_y), (710, center_y)], fill=(255, 255, 255), width=2)
    
    # High stress nucleus
    draw.ellipse([(center_x - 30, center_y - 30), (center_x + 30, center_y + 30)], fill=(255, 255, 255))
    draw.text((310, 510), "ISOCHROMATIC FRINGES", fill=(255, 255, 255))
    draw.text((325, 535), "PEAK STRESS: 94.2 PSI", fill=(239, 68, 68))
    
    img.save("public/subsystems/photoelastic_optics.png")

# 4. Farnebäck Optical Flow CCTV Analytics
def gen_cctv():
    img, draw = create_base("CV-04", "Farnebäck Optical Flow Analytics", "POLYNOMIAL EXPANSION VELOCITY VECTORS")
    
    # CCTV camera viewport frame
    draw.rectangle([(80, 140), (720, 760)], fill=(15, 23, 42), outline=(56, 189, 248), width=3)
    
    # Camera HUD Watermarks
    draw.ellipse([(110, 165), (124, 179)], fill=(239, 68, 68))
    draw.text((135, 165), "LIVE FEED // BENCHMARK RTSP [30 FPS]", fill=(245, 242, 235))
    draw.text((540, 165), "LATENCY: 24 MS", fill=(56, 189, 248))
    
    # Chokepoint bottleneck gate
    draw.rectangle([(80, 420), (320, 460)], fill=(51, 65, 85))
    draw.rectangle([(480, 420), (720, 460)], fill=(51, 65, 85))
    draw.text((350, 432), "EXIT APERTURE", fill=(16, 185, 129))
    
    # Dense optical flow vector field
    for x in range(120, 680, 40):
        for y in range(480, 730, 45):
            # Direction towards aperture (400, 440)
            dx = 400 - x
            dy = 440 - y
            dist = math.hypot(dx, dy) or 1
            vx = (dx / dist) * 22
            vy = (dy / dist) * 22
            
            # Vector arrow
            col = (239, 68, 68) if dist < 160 else ((245, 158, 11) if dist < 280 else (56, 189, 248))
            draw.line([(x, y), (x + vx, y + vy)], fill=col, width=2)
            draw.ellipse([(x-2, y-2), (x+2, y+2)], fill=(255, 255, 255))
            
    # Hotspot callout
    draw.rectangle([(320, 340), (480, 390)], fill=(239, 68, 68), outline=(255, 255, 255), width=2)
    draw.text((335, 355), "HOTSPOT // CRITICAL", fill=(255, 255, 255))
    
    img.save("public/subsystems/cctv_analytics.png")

# 5. Mobile Guard Early-Warning Deck
def gen_guard():
    img, draw = create_base("TAC-05", "Marshal Early-Warning Deck", "GLANCEABLE TACTICAL HUD DISPATCH")
    
    # Handheld Mobile Device Frame
    draw.rectangle([(220, 140), (580, 780)], fill=(15, 23, 42), outline=(148, 163, 184), width=4)
    draw.rectangle([(240, 180), (560, 740)], fill=(11, 15, 23), outline=(40, 55, 80), width=2)
    
    # Phone Top Notch
    draw.rectangle([(360, 155), (440, 165)], fill=(148, 163, 184))
    
    # Guard App Header
    draw.rectangle([(240, 180), (560, 240)], fill=(239, 68, 68))
    draw.text((260, 195), "FORCESIGHT GUARD // ALERT", fill=(255, 255, 255))
    draw.text((260, 215), "SECTOR B3 BREACH: 94.8 PSI", fill=(255, 255, 255))
    
    # 5x4 Grid on Phone screen
    grid_start_x, grid_start_y = 260, 260
    for r in range(4):
        for c in range(5):
            gx = grid_start_x + c * 58
            gy = grid_start_y + r * 50
            is_hot = (r == 1 and c == 2) # B3
            bg = (239, 68, 68) if is_hot else ((245, 158, 11) if r == 1 else (30, 41, 59))
            draw.rectangle([(gx, gy), (gx + 50, gy + 42)], fill=bg, outline=(71, 85, 105))
            txt = "B3" if is_hot else f"{chr(65+r)}{c+1}"
            draw.text((gx + 12, gy + 12), txt, fill=(255, 255, 255))
            
    # Tactical Dispatch Action Button
    draw.rectangle([(260, 500), (540, 560)], fill=(16, 185, 129), outline=(255, 255, 255), width=2)
    draw.text((280, 520), "DEPLOY MARSHALS -> SECTOR B3", fill=(0, 0, 0))
    
    # Vibration / Siren Wave Icon
    draw.arc([(340, 600), (460, 700)], 180, 0, fill=(239, 68, 68), width=4)
    draw.arc([(310, 570), (490, 720)], 180, 0, fill=(239, 68, 68), width=3)
    draw.text((330, 705), "HAPTIC SIREN ACTIVE", fill=(239, 68, 68))
    
    img.save("public/subsystems/guard_dispatch.png")

gen_piston()
gen_loadcell()
gen_photoelastic()
gen_cctv()
gen_guard()
print("All 5 ForceSight AI subsystem schematics generated successfully.")
