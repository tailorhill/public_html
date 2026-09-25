"""Blender source for Valley Dogs reference-based hardware. Units: viewer cm.
Run: Blender --background --factory-startup --python tools/build_hardware.py
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'hardware'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material(name, color, metallic, roughness):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=roughness
    return m
plastic=material('nylon-black',(0.012,0.014,0.016),0,0.48)
metal=material('hardware-finish',(0.58,0.60,0.64),1,0.25)
roots={}
def group(name):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); roots[name]=o; return o

def apply(obj,mod):
    bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)

def box(name,loc,size,bevel=0.08,mat=None,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name
    o.dimensions=size; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Manufactured edge radii','BEVEL');m.width=bevel;m.segments=3;apply(o,m)
    if mat:o.data.materials.append(mat)
    if parent:o.parent=parent
    return o

def cut(obj,loc,size,radius=0.06):
    cutter=box('tool',loc,size,radius)
    mod=obj.modifiers.new('Through slot','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;apply(obj,mod)
    bpy.data.objects.remove(cutter,do_unlink=True)

def finish(obj):
    for p in obj.data.polygons:p.use_smooth=True
    obj.data.set_sharp_from_angle(angle=math.radians(55))
    m=obj.modifiers.new('Face weighted normals','WEIGHTED_NORMAL');m.keep_sharp=True;m.weight=40;apply(obj,m)

def tube(name,points,radius,parent,closed=True,sides=12):
    pts=[Vector(p) for p in points];n=len(pts);verts=[];faces=[]
    for i,p in enumerate(pts):
        prev=pts[(i-1)%n] if closed or i else pts[0]
        nxt=pts[(i+1)%n] if closed or i<n-1 else pts[-1]
        tangent=(nxt-prev).normalized();normal=Vector((-tangent.y,tangent.x,0)).normalized()
        for j in range(sides):
            a=j*math.tau/sides;v=p+radius*(normal*math.cos(a)+Vector((0,0,math.sin(a))));verts.append(v)
    for i in range(n if closed else n-1):
        for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,((i+1)%n)*sides+(j+1)%sides,((i+1)%n)*sides+j))
    if not closed:faces.extend([tuple(reversed(range(sides))),tuple((n-1)*sides+j for j in range(sides))])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(metal)
    for p in mesh.polygons:p.use_smooth=True
    return o

def rounded_path(w,h,r,z=0,steps=12):
    pts=[]
    for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(steps+1):
            a=math.radians(start+i*90/steps);pts.append((cx+r*math.cos(a),cy+r*math.sin(a),z))
    return pts

# Closed black side-release. Deep slots, hollow receiver, split seam and side grips.
r=group('side-release')
f=box('Receiver moulding',(0.90,0,0.48),(3.30,3.58,0.78),0.18,plastic,r)
cut(f,(2.00,0,0.5),(0.40,3.08,2),0.09)
cut(f,(-0.70,0,0.33),(0.7,2.85,0.35),0.08)
for sign in (-1,1):cut(f,(0.0,sign*1.69,0.48),(0.93,0.55,0.50),0.12)
finish(f)
m=box('Plug moulding',(-1.68,0,0.43),(1.77,3.46,0.68),0.16,plastic,r)
cut(m,(-2.09,0,0.5),(0.38,3.05,2),0.08);finish(m)
for sign in (-1,1):
    o=box('Spring release button',(0.0,sign*1.66,0.47),(0.78,0.24,0.35),0.09,plastic,r);finish(o)
    for k in range(4):
        o=box('Grip rib',(-0.27+k*0.18,sign*1.79,0.49),(0.045,0.032,0.20),0.014,plastic,r);finish(o)
# Fine moulding line, intentionally no invented branding.
panel=box('Recessed face panel',(0.7,0,0.867),(1.64,2.35,0.018),0.008,plastic,r);finish(panel)

# D-ring outline: straight stock with rounded shoulders and a broad bow.
r=group('d-ring');pts=[]
pts.extend([(0,-1.45+i*2.90/12,0.34) for i in range(13)])
# Rounded transition into the bow, sampled cubic segments.
curves=[[(0,1.45), (0,1.68),(-0.20,1.67),(-0.46,1.64)],
        [(-0.46,1.64),(-2.32,1.57),(-2.32,-1.57),(-0.46,-1.64)],
        [(-0.46,-1.64),(-0.20,-1.67),(0,-1.68),(0,-1.45)]]
for points in curves:
    for i in range(1,25):
        t=i/24;v=sum((Vector(points[j])*([ (1-t)**3,3*(1-t)**2*t,3*(1-t)*t*t,t**3][j]) for j in range(4)),Vector((0,0)))
        pts.append((v.x,v.y,0.34))
pts.pop();tube('Rounded D stock',pts,0.145,r)

# Cast three-bar slider: two long round-ended openings, as on the supplier sheet.
r=group('tri-glide')
profile=bpy.data.curves.new('Rounded cast profile','CURVE');profile.dimensions='2D';profile.fill_mode='BOTH';profile.extrude=0.095;profile.bevel_depth=0.055;profile.bevel_resolution=3
outlines=[rounded_path(2.10,3.64,0.48)]
for sign in (-1,1):outlines.append(list(reversed([(x+sign*0.51,y,z) for x,y,z in rounded_path(0.72,3.10,0.35)])))
for points in outlines:
    spline=profile.splines.new('POLY');spline.points.add(len(points)-1)
    for v,p in zip(spline.points,points):v.co=(*p,1)
    spline.use_cyclic_u=True
obj=bpy.data.objects.new('Three bar frame',profile);bpy.context.collection.objects.link(obj);obj.parent=r;obj.location.z=0.23;obj.data.materials.append(metal)
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH');finish(bpy.context.object)

# BioThane adjustable collar: rounded roller buckle and hinged tongue.
r=group('roller-buckle')
tube('Buckle frame',rounded_path(2.32,3.42,0.48,0.32),0.145,r)
tube('Tongue spindle',[(-1.16,-1.45,0.32),(-1.16,1.45,0.32)],0.13,r,False)
# Roller along the opposite bar.
bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=0.205,depth=2.78,location=(1.16,0,0.32),rotation=(math.pi/2,0,0))
o=bpy.context.object;o.name='Roller';o.parent=r;o.data.materials.append(metal);finish(o)
pts=[(-1.15+2.48*i/24,0,0.49+0.13*math.sin(math.pi*i/24)) for i in range(25)]
tube('Curved tongue',pts,0.10,r,False)
# Separate keeper guides the punched strap behind the buckle.
r=group('keeper');tube('Strap keeper',rounded_path(0.72,3.34,0.28,0.28),0.12,r)

# Half-slip guides: oval eyes with enough clearance for the folded 3 cm strap.
r=group('half-slip-ring');tube('Oval half slip guide',rounded_path(1.35,3.56,0.62,0.10),0.135,r)
# Removable keeper at the end of the adjustable collar's lining; small visible split.
r=group('split-keeper')
pts=[(0.425,0.10,0.12)]+rounded_path(0.85,3.44,0.36,0.12)+[(0.425,-0.10,0.12)]
tube('Split lining keeper',pts,0.11,r,False)

stats={}
for name,root in roots.items():
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for obj in root.children:obj.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)
    stats[name]={'vertices':sum(len(o.data.vertices) for o in root.children),'bytes':(OUT/(name+'.glb')).stat().st_size}
# Source opens as an editable modelling board with a studio preview camera.
positions=[(-4,2.5,0),(2.5,2.5,0),(6.5,2.5,0),(-2.8,-2.4,0),(2.2,-2.4,0),(6.5,-2.4,0),(9,-2.4,0)]
for root,position in zip(roots.values(),positions):root.location=position
floor=box('Preview floor',(0,0,-0.12),(200,200,0.1),0,material('Studio floor',(0.22,0.24,0.26),0,0.82))
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(0.5,0.5,0.5,1)
world.node_tree.nodes['Background'].inputs[1].default_value=0.6
for name,loc,power,size in [('Key',(-5,-3,11),1800,8),('Edge',(6,6,8),2200,6),('Fill',(0,-7,5),650,7)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Hardware preview');cam=bpy.data.objects.new('Hardware preview',camdata);bpy.context.collection.objects.link(cam)
cam.location=(4,-11,24);cam.rotation_euler=(Vector((0.5,0.4,0))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=24
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=88;scene.render.filepath=str(OUT/'preview.jpg')
bpy.ops.object.select_all(action='DESELECT')
for root in roots.values():root.select_set(True)
bpy.context.view_layer.objects.active=roots['side-release']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'valley-dogs-hardware.blend'))
(OUT/'build-stats.json').write_text(json.dumps(stats,indent=2))
print('HARDWARE_STATS',json.dumps(stats))
import sys
if '--render' in sys.argv:bpy.ops.render.render(write_still=True)
