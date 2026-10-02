"""Bake a repeating cotton weave from modeled yarn. Units are centimeters.
Reference: customer photos 2, 3, 9 and 13; no photo pixels are included.
Run: Blender --background --factory-startup --python tools/build_cotton_weave.py
"""
import bpy, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/materials/cotton'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=8
# Eight crossings in a 0.8 cm tile. Neighboring yarn alternates over/under.
verts=[]; faces=[]
for axis in (0,1):
 for row in range(-2,11):
  for filament in range(3):
   start=len(verts); steps=192; sides=8
   for i in range(steps+1):
    t=-0.2+1.2*i/steps
    center=row*.1+(filament-1)*.024
    z=.048 + .021*math.cos(math.pi*(t/.1+row))*(1 if axis==0 else -1)
    for j in range(sides):
     a=2*math.pi*j/sides
     cross=center+.014*math.cos(a)
     zz=z+.015*math.sin(a)+.0015*math.sin(t*math.pi*100+filament)
     verts.append((t,cross,zz) if axis==0 else (cross,t,zz))
   for i in range(steps):
    for j in range(sides):
     a=start+i*sides+j; b=start+i*sides+(j+1)%sides
     faces.append((a,b,b+sides,a+sides))
mesh=bpy.data.meshes.new('Interlaced cotton fibers');mesh.from_pydata(verts,[],faces);mesh.update()
yarn=bpy.data.objects.new('Cotton yarn — 0.8 cm seamless tile',mesh);bpy.context.collection.objects.link(yarn)
for p in mesh.polygons:p.use_smooth=True
mat=bpy.data.materials.new('Yarn height');mat.use_nodes=True
nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');geom=nodes.new('ShaderNodeNewGeometry');sep=nodes.new('ShaderNodeSeparateXYZ');div=nodes.new('ShaderNodeMath');div.operation='DIVIDE';div.inputs[1].default_value=.095
links=mat.node_tree.links;links.new(geom.outputs['Position'],sep.inputs[0]);links.new(sep.outputs['Z'],div.inputs[0]);links.new(div.outputs[0],em.inputs['Color']);links.new(em.outputs[0],out.inputs['Surface']);yarn.data.materials.append(mat)
bpy.ops.mesh.primitive_plane_add(size=.8,location=(.4,.4,0));plane=bpy.context.object;plane.name='Web material bake target'
target=bpy.data.materials.new('Baked cotton');target.use_nodes=True;plane.data.materials.append(target)
image=bpy.data.images.new('Cotton relief',width=512,height=512,alpha=False);image.colorspace_settings.name='Non-Color'
node=target.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;target.node_tree.nodes.active=node
bpy.ops.object.select_all(action='DESELECT');yarn.select_set(True);plane.select_set(True);bpy.context.view_layer.objects.active=plane
scene.render.bake.use_selected_to_active=True;scene.render.bake.cage_extrusion=.16;scene.render.bake.max_ray_distance=.3;scene.render.bake.margin=0
for bake,name in [('EMIT','height.png'),('NORMAL','normal.png')]:
 bpy.ops.object.bake(type=bake)
 image.filepath_raw=str(OUT/name);image.file_format='PNG';image.save()
# Keep the modeled source editable, with the normal map assigned to the target.
image.pack();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cotton-weave.blend'))
print('Cotton weave baked to',OUT)
