#version 430 core
layout(location=0)in vec3 inPos;
layout(location=1)in vec2 inTexUV;
layout(location=2)in vec3 inNorm;
layout(location=3)in ivec4 inBoneIds;
layout(location=4)in vec4 inWeights;

out VS_OUT {
  vec3 Pos;
  vec2 TexUV;
  vec3 Norm;
} vs_out;

const int MAX_BONES = 100;
const int MAX_BONE_INFLUENCE = 4;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform mat4 u_model_matrix;

uniform mat4 u_final_bone_mats[MAX_BONES];
uniform int u_is_animating;

void main(){
  vs_out.TexUV = inTexUV;
  vec4 totalPosition = vec4(0.0);

  if (u_is_animating > 0) {
    vec3 totalNormal = vec3(0.0);
    for(int i = 0 ; i < MAX_BONE_INFLUENCE ; i++) {
      if(inBoneIds[i] == -1) continue;
      if(inBoneIds[i] >= MAX_BONES) {
          totalPosition = vec4(inPos, 1.0f);
          break;
      }
      vec4 localPosition = u_final_bone_mats[inBoneIds[i]] * vec4(inPos,1.0);
      totalPosition += localPosition * inWeights[i];
      //totalNormal += mat3(u_final_bone_mats[inBoneIds[i]]) * inNorm;
    }
    vs_out.Pos = (u_model_matrix * totalPosition).xyz;
  } else {  // Not Animating
    mat3 normal_matrix = transpose(inverse(mat3(u_model_matrix)));
    vs_out.Norm = normalize(normal_matrix * inNorm);
    vs_out.Pos = (u_model_matrix * vec4(inPos, 1.0)).xyz;
    totalPosition = vec4(inPos, 1.0);
  }
  mat4 viewMatrix = u_view_matrix * u_model_matrix;
  gl_Position = u_projection_matrix * viewMatrix * totalPosition;
}