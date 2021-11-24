#version 430 core
layout(location=0)in vec3 inPos;
layout(location=1)in vec2 inTexUV;
layout(location=2)in vec3 inNorm;
layout(location=3)in ivec4 inBoneIds;
layout(location=4)in vec4 inWeights;

layout(location=0)out vec3 pass_Pos;
layout(location=1)out vec2 pass_TexUV;
layout(location=2)out vec3 pass_Norm;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform mat4 u_model_matrix;

const int MAX_BONES = 100;
const int MAX_BONE_INFLUENCE = 4;
uniform mat4 finalBonesMatrices[MAX_BONES];

uniform int hasAnimation;
uniform int isAnimating;

void main() {
  pass_TexUV = inTexUV;

  if (hasAnimation) {
    vec4 totalPosition = vec4(0.0);
    for(int i = 0 ; i < MAX_BONE_INFLUENCE ; i++)
    {
        if(inBoneIds[i] == -1) 
            continue;
        if(inBoneIds[i] >= MAX_BONES) 
        {
            totalPosition = vec4(inPos,1.0f);
            break;
        }
        vec4 localPosition = finalBonesMatrices[inBoneIds[i]] * vec4(inPos,1.0);
        totalPosition += localPosition * inWeights[i];
        // vec3 localNormal = mat3(finalBonesMatrices[inBoneIds[i]]) * inNorm;
    }
    pass_Pos = (u_model_matrix * totalPosition).xyz;
    mat3 normal_matrix = transpose(inverse(mat3(u_model_matrix) * totalPosition));
    pass_Norm = normalize(normal_matrix * inNorm);
  } else {
    pass_Pos = (u_model_matrix * vec4(inPos, 1)).xyz;
    mat3 normal_matrix = transpose(inverse(mat3(u_model_matrix) * vec3(inPos, 1)));
    pass_Norm = normalize(normal_matrix * inNorm);
  }

  mat4 viewModel = u_view_matrix * u_model_matrix;

  if (isAnimating) {
    gl_Position = u_projection_matrix * viewModel * totalPosition;
  } else {
    gl_Position = u_projection_matrix * viewModel * vec4(inPos, 1.0));
  }
}
