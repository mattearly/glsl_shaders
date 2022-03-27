#version 430
out vec4 FragColor;
uniform vec3 u_stencil_color;
void main() {
  FragColor = vec4(u_stencil_color, 1.0);
}