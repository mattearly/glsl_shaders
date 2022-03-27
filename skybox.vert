#version 430 core
layout(location = 0) in vec3 inPos;
out vec3 TexCoords;
uniform mat4 u_projection;
uniform mat4 u_view;
void main(){
  TexCoords = inPos;
  vec4 pos = u_projection * u_view * vec4(inPos, 1.0);
  gl_Position = pos.xyww;
}