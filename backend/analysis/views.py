import os
import pandas as pd
import json
import re
import math
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PRELOADED_PATH = os.path.join(BASE_DIR, "preloaded_data", "sample.xlsx")

_DATA_CACHE = None


def clean_nan(obj):
    """Recursively replace NaN with None so JSON becomes valid."""
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nan(i) for i in obj]
    return obj


# -------------------------------------------------------
# UTIL: CLEAN TEXT
# -------------------------------------------------------
def _normalize_text(s):
    if pd.isna(s):
        return ""
    s = str(s).strip()
    s = re.sub(r"\s+", " ", s)
    return s.replace("\u200b", "").lower()


# -------------------------------------------------------
# UTIL: NORMALIZE COLUMNS
# -------------------------------------------------------
def normalize_columns(df):
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
        .str.replace(r"[^\w_]", "", regex=True)
    )
    return df


# -------------------------------------------------------
# LOAD DATASET (CACHE)
# -------------------------------------------------------
def load_dataset(path=PRELOADED_PATH):
    global _DATA_CACHE
    if _DATA_CACHE is None:
        df = pd.read_excel(path, engine="openpyxl")
        df = normalize_columns(df)

        # detect area col
        area_cols = [
            c for c in df.columns if "final" in c and "location" in c
        ] + [c for c in df.columns if c in ("area", "locality", "location")]

        area_col = area_cols[0] if area_cols else df.columns[0]
        df["area_norm"] = df[area_col].apply(_normalize_text)

        # fix year
        if "year" in df.columns:
            df["year"] = pd.to_numeric(df["year"], errors="coerce")

        _DATA_CACHE = df

    return _DATA_CACHE.copy()


# -------------------------------------------------------
# FLEXIBLE AREA MATCHING
# -------------------------------------------------------
def _match_areas(df, requested_areas):
    norm_targets = [_normalize_text(a) for a in requested_areas]
    frames = []
    used_map = {}

    for orig, norm in zip(requested_areas, norm_targets):

        # exact
        exact = df["area_norm"] == norm
        if exact.any():
            frames.append(df[exact])
            used_map[orig] = norm
            continue

        # contains
        contains = df["area_norm"].str.contains(re.escape(norm))
        if contains.any():
            frames.append(df[contains])
            used_map[orig] = norm
            continue

        # token match
        found = False
        for t in norm.split(" "):
            token = df["area_norm"].str.contains(re.escape(t))
            if token.any():
                frames.append(df[token])
                used_map[orig] = norm
                found = True
                break

        if not found:
            used_map[orig] = None

    if frames:
        final = pd.concat(frames).drop_duplicates().reset_index(drop=True)
    else:
        final = df.iloc[0:0]

    return final, used_map


# -------------------------------------------------------
# DETECT PRICE COLUMN
# -------------------------------------------------------
def detect_price_col(columns):
    patterns = [
        "flat___weighted_average_rate",
        "flat__weighted_average_rate",
        "flat_weighted_average_rate",
        "flatweightedaveragerate",
        "weighted_average_rate",
        "flat_avg_rate",
        "avg_price",
        "avgprice",
        "price",
        "rate",
    ]

    for c in columns:
        name = c.replace("__", "_")
        if "flat" in name and "average" in name and "rate" in name:
            return c

    for p in patterns:
        for c in columns:
            if p == c:
                return c

    for c in columns:
        if "rate" in c:
            return c

    return None


# -------------------------------------------------------
# UPLOAD EXCEL
# -------------------------------------------------------
@csrf_exempt
def upload_file(request):
    global _DATA_CACHE
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    f = request.FILES.get("file")
    if not f:
        return JsonResponse({"error": "No file uploaded"}, status=400)

    try:
        df = pd.read_excel(f, engine="openpyxl")
        df = normalize_columns(df)

        area_cols = [
            c for c in df.columns if "final" in c and "location" in c
        ] + [c for c in df.columns if c in ("area", "locality", "location")]

        area_col = area_cols[0] if area_cols else df.columns[0]
        df["area_norm"] = df[area_col].apply(_normalize_text)

        _DATA_CACHE = df
        return JsonResponse({"status": "ok", "rows": len(df)})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# -------------------------------------------------------
# MAIN: QUERY AREA
# -------------------------------------------------------
@csrf_exempt
def query_area(request):
    params = request.GET.dict()

    if request.method == "POST":
        try:
            params.update(json.loads(request.body.decode("utf-8")))
        except:
            pass

    raw = params.get("area") or params.get("areas") or ""
    areas = [a.strip() for a in raw.split(",") if a.strip()]

    if not areas:
        return JsonResponse({"error": "No area provided"}, status=400)

    df = load_dataset()
    matched, used = _match_areas(df, areas)

    if matched.empty:
        suggestions = df["area_norm"].unique().tolist()[:20]
        return JsonResponse({"error": "No records found", "try": suggestions}, status=404)

    summaries = {}
    charts = {}

    for req in areas:
        norm = _normalize_text(req)
        sub = matched[matched["area_norm"].str.contains(re.escape(norm))]

        if sub.empty:
            sub = matched[matched["area_norm"] == norm]

        n = len(sub)

        price_col = detect_price_col(sub.columns)
        year_col = "year" if "year" in sub.columns else None

        # BUILD SUMMARY
        if price_col and n > 0:
            avg = float(sub[price_col].astype(float).dropna().mean())
            summaries[req] = f"{req}: {n} records found. Avg price = {round(avg, 2)}"
        else:
            summaries[req] = f"{req}: {n} records found."

        # BUILD CHART (NaN-safe)
        if year_col and price_col:
            t = sub[[year_col, price_col]].dropna()
            t[year_col] = t[year_col].astype(int)
            g = t.groupby(year_col)[price_col].mean().reset_index()

            charts[req] = {
                "years": g[year_col].tolist(),
                "prices": g[price_col].astype(float).fillna(0).round(2).tolist()
            }
        else:
            charts[req] = {"years": [], "prices": []}

    # CLEAN ROWS (replace NaN → None)
        clean_df = matched.head(200)
        clean_df = clean_df.where(pd.notnull(clean_df), None)
        rows_json = clean_df.to_dict(orient="records")

    response_payload={
        "status": "ok",
        "summary": summaries,
        "chart": charts,
        "rows": rows_json
    }

# FINAL FIX: MAKE JSON 100% VALID
    response_payload = clean_nan(response_payload)

    return JsonResponse(response_payload, safe=False)



# -------------------------------------------------------
# DOWNLOAD CSV
# -------------------------------------------------------
def download_filtered_csv(request):
    area = request.GET.get("area", "")
    areas = [a.strip() for a in area.split(",") if a.strip()]

    if not areas:
        return JsonResponse({"error": "no area"}, status=400)

    df = load_dataset()
    matched_df, _ = _match_areas(df, areas)

    if matched_df.empty:
        return JsonResponse({"error": "no records found"}, status=404)

    csv_data = matched_df.to_csv(index=False).encode("utf-8")

    response = HttpResponse(csv_data, content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="filtered_{area}.csv"'
    return response
