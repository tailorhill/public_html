import bpy, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT / "assets/hardware"
from mathutils import Vector, Matrix
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(OUT/'sources/petuhov-buckle.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:
 matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4)
 o.data.transform(matrix)
 # Male spring arms enter the receiver cavity.
 if '6091483' in o.name:o.data.transform(Matrix.Translation((30,0,0)))
 o.data.transform(Matrix.Rotation(-math.pi/2,4,'X'))
pts=[v.co for o in meshes for v in o.data.vertices];lo=Vector([min(p[i] for p in pts) for i in range(3)]);hi=Vector([max(p[i] for p in pts) for i in range(3)])
scale=3.54/(hi.y-lo.y);center=(lo+hi)/2
for o in meshes:
 for v in o.data.vertices:v.co=(v.co-center)*scale+Vector((0,0,0.50))
 o.data.update()
print('FITTED',list((hi-lo)*scale))
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'reference-side-release.glb'),export_format='GLB',use_selection=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'reference-side-release.blend'))
