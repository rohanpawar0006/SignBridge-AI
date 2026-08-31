import re
import json

path = r'C:\Users\Sri\.gemini\antigravity-ide\brain\7805053d-6ae2-4322-9ff4-21c0af7a7db5\.system_generated\steps\276\content.md'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)

# Script 4 (Schema.org Dataset)
print("=== SCRIPT 4 (Schema.org) ===")
try:
    d4 = json.loads(matches[4])
    print("Name:", d4.get("name"))
    print("Keys in d4:", list(d4.keys()))
    if "distribution" in d4:
        for dist in d4["distribution"]:
            print("  Dist:", dist)
    if "hasPart" in d4:
        print("hasPart count:", len(d4["hasPart"]))
except Exception as e:
    print("Error parsing script 4:", e)

# Script 10 (window.INITIAL_STATE)
print("\n=== SCRIPT 10 (window.INITIAL_STATE) ===")
s10 = matches[10]
start = s10.find('{')
end = s10.rfind('}')
if start != -1 and end != -1:
    raw_json = s10[start:end+1]
    d10 = json.loads(raw_json)
    print("Keys in d10:", list(d10.keys()))
    dataset_info = d10.get("dataset", {})
    print("dataset_info keys:", list(dataset_info.keys()))
    print("files key in d10:", d10.get("files"))
    print("repository key in d10:", d10.get("repository"))
    print("versions key in d10:", d10.get("versions"))
    print("dataset_info doi:", dataset_info.get("doi"))
    print("s3 key in d10:", d10.get("s3"))


