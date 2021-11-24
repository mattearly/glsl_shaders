#version 430 core
layout(location=0)in vec3 pass_Pos;
layout(location=1)in vec2 pass_TexUV;
layout(location=2)in vec3 pass_Norm;

layout(location=0)out vec4 out_Color;

struct Material {
  sampler2D Albedo;
  sampler2D Normal;
  sampler2D Metallic;
  sampler2D Roughness;
  sampler2D AmbientOcclusion;
};
struct DirectionalLight {
  vec3 Direction;
  vec3 Ambient;
  vec3 Diffuse;
  vec3 Specular;
};
struct PointLight {
  vec3 Position;
  float Constant, Linear, Quadratic;
  vec3 Ambient, Diffuse, Specular;
};
struct SpotLight {
  vec3 Position, Direction;
  float CutOff, OuterCutOff;
  float Constant, Linear, Quadratic;
  vec3 Ambient, Diffuse, Specular;
};
const vec3 default_color = vec3(0.1);
const int MAXPOINTLIGHTS = 24; // if changed, needs to match on light controllers
const int MAXSPOTLIGHTS = 12;
uniform vec3 u_view_pos;
uniform int hasAlbedo;
uniform int hasSpecular;
uniform int hasNormal;
uniform int hasEmission;
uniform Material material;
uniform int isDirectionalLightOn;
uniform DirectionalLight directionalLight;
uniform PointLight pointLight[MAXPOINTLIGHTS];
uniform SpotLight spotLight[MAXSPOTLIGHTS];
uniform int NUM_POINT_LIGHTS;
uniform int NUM_SPOT_LIGHTS;
vec3 CalcDirectionalLight(vec3 normal, vec3 viewDir) {
  vec3 lightDir = normalize(-directionalLight.Direction);
  // diffuse shading
  float diff = max(dot(normal, lightDir), 0.);
  // specular shading
  float spec;
  if (hasSpecular > 0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(viewDir, reflectDir), 0.), material.Shininess);
  }
  // combine results
  vec3 ambient;
  vec3 diffuse;
  if (hasAlbedo > 0) { 
    ambient = directionalLight.Ambient * texture(material.Albedo, pass_TexUV).rgb;
    diffuse = directionalLight.Diffuse * diff * texture(material.Albedo, pass_TexUV).rgb;
  } else {
    ambient = directionalLight.Ambient * default_color;
    diffuse = directionalLight.Diffuse * diff * default_color;
  }
  if (hasSpecular > 0) {
    vec3 specular = directionalLight.Specular * spec * texture(material.Specular, pass_TexUV).rgb;
    return(ambient + diffuse + specular);
  } else {
    return(ambient + diffuse);
  }
}
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 viewDir){
  vec3 lightDir = normalize(light.Position - pass_Pos);
  // diffuse shading
  float diff = max(dot(normal, lightDir), 0.0);
  // specular shading
  float spec;
  if (hasSpecular > 0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(viewDir, reflectDir), 0.0), material.Shininess);
  }
  // attenuation
  float dist = length(light.Position - pass_Pos);
  float attenuation = 1.0 / (light.Constant + light.Linear * dist + light.Quadratic * (dist * dist));
  // combine results
  vec3 ambient;
  vec3 diffuse;
  if (hasAlbedo > 0) {
    ambient = light.Ambient * texture(material.Albedo, pass_TexUV).rgb;
    diffuse = light.Diffuse * diff * texture(material.Albedo, pass_TexUV).rgb;
  } else {
    ambient = light.Ambient * default_color;
    diffuse = light.Diffuse * diff * default_color;
  }
  ambient *= attenuation;
  diffuse *= attenuation;
  vec3 specular;
  if (hasSpecular > 0) {
    specular = light.Specular * spec * texture(material.Specular, pass_TexUV).rgb;
  } else {
    specular = vec3(1,1,1);
  }
  specular *= attenuation;
  return (ambient + diffuse + specular);
}
vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 viewDir){
  vec3 lightDir = normalize(light.Position - pass_Pos);
  // diffuse shading
  float diff = max(dot(normal, lightDir), 0.0);
  // specular shaing
  float spec;
  if (hasSpecular > 0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(viewDir, reflectDir), 0.0), material.Shininess);
  }
  // attenuation
  float dist = length(light.Position - pass_Pos);
  float attenuation = 1.0 / (light.Constant + light.Linear * dist + light.Quadratic * (dist * dist));
  // cone of light
  float theta = dot(lightDir, normalize(-light.Direction));
  float epsilon = light.CutOff - light.OuterCutOff;
  float intensity = clamp((theta - light.OuterCutOff) / epsilon, 0.0, 1.0);
  // combine results
   vec3 ambient;
   vec3 diffuse;
  if (hasAlbedo > 0) {
    ambient = light.Ambient * texture(material.Albedo, pass_TexUV).rgb;
    diffuse = light.Diffuse * diff * texture(material.Albedo, pass_TexUV).rgb;
  } else {
    ambient = light.Ambient * default_color;
    diffuse = light.Diffuse * diff * default_color;
  }
  if (hasSpecular > 0) {
    vec3 specular = light.Specular * spec * texture(material.Specular, pass_TexUV).rgb;
    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    specular *= attenuation * intensity;
    return (ambient + diffuse + specular);
  } else {
    ambient *= attenuation * intensity;
    diffuse *= attenuation * intensity;
    return (ambient + diffuse);
  }
}
void main()
{
  vec3 normal;
  if (hasNormal > 0) {
    normal = texture(material.Normal, pass_TexUV).rgb;
    normal = normalize(normal * 2.0 - 1.0);
  } else {
    normal = normalize(pass_Norm * 2.0 - 1.0);
  }
  vec3 view_dir = normalize(u_view_pos - pass_Pos);
  vec3 result;
  if (isDirectionalLightOn > 0)
    result += CalcDirectionalLight(normal, view_dir);
  int i = 0;
  for (i; i < NUM_POINT_LIGHTS; i++)
    result += CalcPointLight(pointLight[i], normal, view_dir);
  for (i = 0; i < NUM_SPOT_LIGHTS; i++)
    result += CalcSpotLight(spotLight[i], normal, view_dir);
  if (hasEmission   0) {
    vec3 emission = texture(material.Emission, pass_TexUV).rgb;
    result += emission;
  }
  out_Color = vec4(result, 1.0);
}