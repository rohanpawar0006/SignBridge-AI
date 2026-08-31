"""
SignBridge AI - Mendeley ISL-CSLTR Dataset Downloader
Downloads the 8.49 GB ISL-CSLTR (Continuous Sign Language Translation and Recognition) dataset
from Mendeley Data (kcmpdxky7p/1), with chunked streaming, progress bar, and automatic extraction.

Dataset Reference:
- Title: ISL-CSLTR: Indian Sign Language Dataset for Continuous Sign Language Translation and Recognition
- Authors: Dr. R. Elakkiya, B. Natarajan (SASTRA Deemed University / Navajeevan Deaf School)
- Funding: Science and Engineering Research Board (SERB), India (SRG/2019/001338)
"""

import os
import sys
import time
import zipfile
import urllib.request

DATASET_URL = "https://data.mendeley.com/public-files/datasets/kcmpdxky7p/files/c14c8953-be53-4c7a-85d5-5bcd7e79d86e/file_downloaded"
ZIP_FILENAME = "ISL_CSLRT_Corpus.zip"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BASE_DIR, "mendeley_raw")
ZIP_FILEPATH = os.path.join(TARGET_DIR, ZIP_FILENAME)
EXTRACT_DIR = os.path.join(TARGET_DIR, "ISL_CSLRT_Corpus")


def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    existing_bytes = 0
    if os.path.exists(target_path):
        existing_bytes = os.path.getsize(target_path)
        if existing_bytes > 0:
            headers['Range'] = f'bytes={existing_bytes}-'
            print(f"[Resume] Found existing partial file ({existing_bytes / (1024*1024):.2f} MB). Resuming...")

    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as resp:
            total_length = resp.headers.get('Content-Length')
            if total_length:
                total_bytes = int(total_length) + existing_bytes
            else:
                total_bytes = 8.49 * 1024 * 1024 * 1024 # Approx 8.49 GB

            mode = 'ab' if existing_bytes > 0 else 'wb'
            downloaded = existing_bytes
            chunk_size = 1024 * 1024 # 1 MB chunks
            start_time = time.time()

            print(f"\n=======================================================")
            print(f"  Downloading ISL-CSLTR Dataset Archive ({ZIP_FILENAME})")
            print(f"  Total Size: {total_bytes / (1024*1024):.2f} MB")
            print(f"  Destination: {target_path}")
            print(f"=======================================================\n")

            with open(target_path, mode) as f:
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    elapsed = time.time() - start_time
                    speed_mbps = (downloaded - existing_bytes) / (elapsed + 1e-6) / (1024 * 1024)
                    progress_pct = (downloaded / total_bytes) * 100 if total_bytes else 0
                    
                    sys.stdout.write(
                        f"\r  Progress: {downloaded / (1024*1024):.1f} / {total_bytes / (1024*1024):.1f} MB "
                        f"({progress_pct:.1f}%) | Speed: {speed_mbps:.2f} MB/s"
                    )
                    sys.stdout.flush()

            print("\n\n[Download Complete] File successfully downloaded!")
            return True

    except Exception as e:
        print(f"\n[Download Error] {e}")
        return False


def extract_zip(zip_path, extract_to):
    print(f"\n=======================================================")
    print(f"  Extracting Archive to: {extract_to}")
    print(f"=======================================================\n")
    
    os.makedirs(extract_to, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        total_files = len(zip_ref.namelist())
        print(f"  Extracting {total_files} files...")
        for i, member in enumerate(zip_ref.namelist()):
            zip_ref.extract(member, extract_to)
            if i % 100 == 0 or i == total_files - 1:
                sys.stdout.write(f"\r  Extracted {i + 1}/{total_files} files ({(i + 1) / total_files * 100:.1f}%)")
                sys.stdout.flush()

    print("\n\n[Extraction Complete] Dataset ready in:")
    print(f"  {os.path.abspath(extract_to)}\n")


def main():
    print("\n=======================================================")
    print("  SignBridge AI - Mendeley ISL-CSLTR Dataset Manager")
    print("=======================================================\n")

    if not os.path.exists(ZIP_FILEPATH):
        success = download_file(DATASET_URL, ZIP_FILEPATH)
        if not success:
            print("[Abort] Download did not complete successfully.")
            return

    if os.path.exists(ZIP_FILEPATH) and not os.path.exists(EXTRACT_DIR):
        extract_zip(ZIP_FILEPATH, EXTRACT_DIR)
    elif os.path.exists(EXTRACT_DIR):
        print(f"[Ready] Extracted dataset already available in:\n  {EXTRACT_DIR}")


if __name__ == "__main__":
    main()
