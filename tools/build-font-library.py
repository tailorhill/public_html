"""Refresh the pinned, static Google Fonts index (font files remain remote)."""
import json, re, urllib.request
from pathlib import Path
req=urllib.request.Request('https://api.github.com/repos/google/fonts/git/trees/main?recursive=1',headers={'User-Agent':'ValleyDogs-DesignTool'})
with urllib.request.urlopen(req,timeout=60) as r: tree=json.load(r)
assert not tree.get('truncated')
items=[]
for entry in tree['tree']:
    path=entry['path']
    if not re.fullmatch(r'ofl/[a-z0-9]+/[A-Za-z0-9-]+\.ttf',path) or entry.get('size',0)>1500000: continue
    filename=path.split('/')[-1][:-4]
    if '-' in filename and not filename.endswith('-Regular'): continue
    base=filename.removesuffix('-Regular')
    name=re.sub(r'(?<=[a-z0-9])(?=[A-Z])',' ',base)
    folder=path.split('/')[1]
    items.append({'id':'gf-'+folder,'name':name,'path':path,'license':f'ofl/{folder}/OFL.txt'})
unique={i['id']:i for i in items}
# Preserve published font revisions so old design links remain reproducible.
existing=Path('assets/libraries/google-fonts.json')
if existing.exists():
    old=json.loads(existing.read_text())
    for font in old['fonts']:
        font.setdefault('revision',old['revision'])
        unique[font['id']]=font
Path('assets/libraries/google-fonts.json').write_text(json.dumps({'revision':tree['sha'],'source':'https://github.com/google/fonts','fonts':sorted(unique.values(),key=lambda f:f['name'])},ensure_ascii=False,separators=(',',':'))+'\n')
print(len(unique),'static font families indexed')
