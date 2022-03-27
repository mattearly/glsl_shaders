#version 430 core
layout(location=0)in vec3 inPos;
layout(location=2)in vec3 inNorm;
layout(location=3)in ivec4 inBoneIds;
layout(location=4)in vec4 inWeights;

const int MAX_BONES = 100;
const int MAX_BONE_INFLUENCE = 4;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform mat4 u_model_matrix;

uniform mat4 u_final_bone_mats[MAX_BONES];
uniform int u_stencil_with_normals;
uniform float u_stencil_scale;
uniform int u_is_animating;

void main(){
  vec4 totalPosition = vec4(0.0);
  if (u_is_animating > 0) {
    for(int i = 0 ; i < MAX_BONE_INFLUENCE ; i++) {
      if(inBoneIds[i] == -1) continue;
      if(inBoneIds[i] >= MAX_BONES) {
          totalPosition = vec4(inPos, 1.0f);
          break;
      }
      vec4 localPosition = u_final_bone_mats[inBoneIds[i]] * vec4(inPos,1.0);
      totalPosition += localPosition * inWeights[i];
    }
  } else {  // Not Animating
    totalPosition = vec4(inPos, 1.0);
  }
  mat4 viewMatrix = u_view_matrix * u_model_matrix;
  if (u_stencil_with_normals > 0) {
    gl_Position = u_projection_matrix * viewMatrix * vec4(totalPosition.xyz + inNorm * (u_stencil_scale - 1.0), 1.0);
  } else {
    gl_Position = u_projection_matrix * viewMatrix * totalPosition;
  }
}