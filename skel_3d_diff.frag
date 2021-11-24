#version 430 core
layout(location=1)in vec2 pass_TexUV;
out vec4 out_Color;
struct Material {
  sampler2D Albedo;
};
uniform int hasAlbedo;
uniform Material material;
void main() {
  if (hasAlbedo > 0) {
    out_Color = texture(material.Albedo, pass_TexUV);
  } else {
    out_Color = vec4(0.75, 0.0, 0.0, 1.0); // red for no texture
  }
}