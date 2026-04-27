import urllib.request, xml.etree.ElementTree as ET, json, re

url = "https://fuorimenu.substack.com/feed"
with urllib.request.urlopen(url) as r:
    tree = ET.parse(r)

articoli = []
for item in tree.findall('.//item')[:10]:
    title = item.findtext('title', '').strip()
    link  = item.findtext('link', '').strip()
    date  = item.findtext('pubDate', '').strip()[:16]
    desc  = item.findtext('description', '')
    clean = re.sub('<[^>]+>', '', desc).strip()[:280]
    articoli.append({"titolo": title, "url": link, "data": date, "estratto": clean, "tag": "Fuorimenu"})

with open('data/fuorimenu.json', 'w') as f:
    json.dump({"articoli": articoli}, f, ensure_ascii=False, indent=2)
print(f"OK — {len(articoli)} articoli scritti")
