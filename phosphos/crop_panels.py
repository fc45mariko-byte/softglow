import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
boxes = {"city":(66,45,1990,455),"ashoka":(66,478,445,1105),"twoshot":(467,474,1588,848),"hunt":(470,868,1583,1105),"demetria":(1606,478,1990,1100)}
inset=8
for k,(a,b,c,d) in boxes.items():
    im.crop((a+inset,b+inset,c-inset,d-inset)).save(f"panels/{k}.png")
# contact sheet
W=1200; ims=[Image.open(f"panels/{k}.png") for k in boxes]
sheet=Image.new("RGB",(W,1400),"white"); y=0
for p in ims:
    p=p.copy(); p.thumbnail((W,270)); sheet.paste(p,(0,y)); y+=p.height+10
sheet.save("contact.png")
