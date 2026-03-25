from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import Annotated
import cv2
import numpy as np
import io

app = FastAPI(title="Freeline Vision AI Server")

def color_distance(c1, c2):
    return sum(abs(a - b) for a, b in zip(c1, c2))

def get_bounding_box(hsv, orig_w, orig_h):
    grey_mask = ((hsv[:, :, 1] < 20) & (hsv[:, :, 2] < 200) & (hsv[:, :, 2] > 100)).astype(np.uint8)*255
    contours, _ = cv2.findContours(grey_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        largest_cnt = max(contours, key=cv2.contourArea)
        return cv2.boundingRect(largest_cnt)
    return 0, 0, orig_w, orig_h

def add_to_blocks(blocks, global_i, global_j, bgr_color):
    found_block = None
    for idx, (cells, c) in enumerate(blocks):
        if color_distance(c, bgr_color) < 40:
            is_adj = any(abs(ci - global_i) <= 1 and abs(cj - global_j) <= 1 for (ci, cj) in cells)
            if is_adj:
                found_block = idx
                break

    if found_block is not None:
        blocks[found_block][0].add((global_i, global_j))
    else:
        blocks.append(({(global_i, global_j)}, bgr_color))

def process_grid_cell(hsv, img, cx, cy, unit, blocks, orig_w, orig_h):
    if cy >= orig_h or cx >= orig_w: return
    
    patch = hsv[max(0,cy-2):cy+3, max(0,cx-2):cx+3]
    mean_hsv = np.mean(patch, axis=(0,1))
    
    if mean_hsv[1] > 15 and mean_hsv[2] > 100:
        bgr_patch = img[max(0,cy-2):cy+3, max(0,cx-2):cx+3]
        bgr_color = tuple(np.mean(bgr_patch, axis=(0,1)).astype(int))
        
        global_i = int(round(cx / unit))
        global_j = int(round(cy / unit))
        
        add_to_blocks(blocks, global_i, global_j, bgr_color)

def find_blocks(hsv, img, hx, hy, hw, hh, orig_w, orig_h, unit):
    blocks = []
    for i in range(int(round(hw/unit))):
        for j in range(int(round(hh/unit))):
            cx = hx + int((i + 0.5) * unit)
            cy = hy + int((j + 0.5) * unit)
            process_grid_cell(hsv, img, cx, cy, unit, blocks, orig_w, orig_h)
    return blocks

def are_blocks_adjacent(cells1, cells2):
    return any(abs(c1[0]-c2[0]) + abs(c1[1]-c2[1]) <= 1 for c1 in cells1 for c2 in cells2)

def try_merge_once(blocks):
    for i in range(len(blocks)):
        for j in range(i+1, len(blocks)):
            if color_distance(blocks[i][1], blocks[j][1]) < 40:
                if are_blocks_adjacent(blocks[i][0], blocks[j][0]):
                    blocks[i][0].update(blocks[j][0])
                    blocks.pop(j)
                    return True
    return False

def merge_blocks(blocks):
    while try_merge_once(blocks):
        pass
    return blocks

def calculate_booths_data(blocks, unit):
    booths_data = []
    for idx, (cells, color) in enumerate(blocks):
        min_i = min(c[0] for c in cells)
        max_i = max(c[0] for c in cells)
        min_j = min(c[1] for c in cells)
        max_j = max(c[1] for c in cells)
        
        bw = max_i - min_i + 1
        bh = max_j - min_j + 1
        
        booths_data.append({
            'x': min_i * unit,
            'y': min_j * unit,
            'width': bw * unit,
            'height': bh * unit,
        })
    return booths_data

def analyze_image(img: np.ndarray):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    orig_h, orig_w, _ = img.shape
    
    hx, hy, hw, hh = get_bounding_box(hsv, orig_w, orig_h)
    unit = max(1, int(round(hw / 20)))
    
    blocks = find_blocks(hsv, img, hx, hy, hw, hh, orig_w, orig_h, unit)
    blocks = merge_blocks(blocks)
    
    booths_data = calculate_booths_data(blocks, unit)

    return {
        'imageWidth': orig_w,
        'imageHeight': orig_h,
        'booths': booths_data
    }

@app.post(
    "/api/analyze",
    responses={
        400: {"description": "Bad Request - Invalid file type or corrupted image."},
        500: {"description": "Internal Server Error - Image processing failed."}
    }
)
async def analyze(file: Annotated[UploadFile, File(...)]):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
             raise HTTPException(status_code=400, detail="Invalid image file.")

        result = analyze_image(img)
        return result

    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
