#version 430 core

in VS_OUT
{
  vec3 Pos;
  vec2 TexUV;
  vec3 Norm;
} fs_in;


layout(location=0)out vec4 out_Color;

struct Material {
  sampler2D Albedo;
  sampler2D Specular;
  sampler2D Normal;
  sampler2D Emission;
  float Shininess;
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

const vec3 DEFAULT_FRAG_COLOR = vec3(0.9, 0.2, 0.2);  // red so they stand out
const int MAXPOINTLIGHTS = 24; // if changed, needs to match on light controllers
const int MAXSPOTLIGHTS = 12;

uniform vec3 u_view_pos;
uniform int u_has_albedo_tex;
uniform int u_has_specular_tex;
uniform int u_has_normal_tex;
uniform int u_has_emission_tex;
uniform Material u_material;
uniform int u_is_dir_light_on;
uniform DirectionalLight u_dir_light;
uniform PointLight u_point_lights[MAXPOINTLIGHTS];
uniform SpotLight u_spot_lights[MAXSPOTLIGHTS];
uniform int u_num_point_lights_in_use;
uniform int u_num_spot_lights_in_use;

vec3 CalculateDirLight(vec3 normal, vec3 viewDir) {
  vec3 lightDir = normalize(-u_dir_light.Direction);
  // diffuse shading
  float diff = max(dot(normal, lightDir), 0.);
  // specular shading
  float spec;
  if (u_has_specular_tex > 0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(viewDir, reflectDir), 0.), u_material.Shininess);
  }
  // combine results
  vec3 ambient;
  vec3 diffuse;
  if (u_has_albedo_tex > 0) { 
    ambient = u_dir_light.Ambient * texture(u_material.Albedo, fs_in.TexUV).rgb;
    diffuse = u_dir_light.Diffuse * diff * texture(u_material.Albedo, fs_in.TexUV).rgb;
  } else {
    ambient = u_dir_light.Ambient * DEFAULT_FRAG_COLOR;
    diffuse = u_dir_light.Diffuse * diff * DEFAULT_FRAG_COLOR;
  }
  if (u_has_specular_tex > 0) {
    vec3 specular = u_dir_light.Specular * spec * texture(u_material.Specular, fs_in.TexUV).r;
    return(ambient + diffuse + specular);
  } else {
    return(ambient + diffuse);
  }
}

vec3 CalculatePointLights(PointLight light, vec3 normal, vec3 viewDir){
  vec3 lightDir = normalize(light.Position - fs_in.Pos);
  // diffuse shading
  float diff = max(dot(normal, lightDir), 0.0);
  // specular shading
  float spec;
  if (u_has_specular_tex > 0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(viewDir, reflectDir), 0.0), u_material.Shininess);
  }
  // attenuation
  float dist = length(light.Position - fs_in.Pos);
  float attenuation = 1.0 / (light.Constant + light.Linear * dist + light.Quadratic * (dist * dist));
  // combine results
  vec3 ambient;
  vec3 diffuse;
  if (u_has_albedo_tex > 0) {
    ambient = light.Ambient * texture(u_material.Albedo, fs_in.TexUV).rgb;
    diffuse = light.Diffuse * diff * texture(u_material.Albedo, fs_in.TexUV).rgb;
  } else {
    ambient = light.Ambient * DEFAULT_FRAG_COLOR;
    diffuse = light.Diffuse * diff * DEFAULT_FRAG_COLOR;
  }
  ambient *= attenuation;
  diffuse *= attenuation;
  vec3 specular;
  if (u_has_specular_tex > 0) {
    specular = light.Specular * spec * texture(u_material.Specular, fs_in.TexUV).r;
  } else {
    specular = vec3(1,1,1);
  }
  specular *= attenuation;
  return (ambient + diffuse + specular);
}

vec3 CalcSpotLight(SpotLight light, vec3 normal, vec3 viewDir){
  vec3 lightDir = normalize(light.Position - fs_in.Pos);
  // diffuse shading
  float diff = max(dot(normal, lightDir), 0.0);
  // specular shaing
  float spec;
  if (u_has_specular_tex > 0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(viewDir, reflectDir), 0.0), u_material.Shininess);
  }
  // attenuation
  float dist = length(light.Position - fs_in.Pos);
  float attenuation = 1.0 / (light.Constant + light.Linear * dist + light.Quadratic * (dist * dist));
  // cone of light
  float theta = dot(lightDir, normalize(-light.Direction));
  float epsilon = light.CutOff - light.OuterCutOff;
  float intensity = clamp((theta - light.OuterCutOff) / epsilon, 0.0, 1.0);
  // combine results
   vec3 ambient;
   vec3 diffuse;
  if (u_has_albedo_tex > 0) {
    ambient = light.Ambient * texture(u_material.Albedo, fs_in.TexUV).rgb;
    diffuse = light.Diffuse * diff * texture(u_material.Albedo, fs_in.TexUV).rgb;
  } else {
    ambient = light.Ambient * DEFAULT_FRAG_COLOR;
    diffuse = light.Diffuse * diff * DEFAULT_FRAG_COLOR;
  }
  if (u_has_specular_tex > 0) {
    vec3 specular = light.Specular * spec * texture(u_material.Specular, fs_in.TexUV).r;
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
  if (u_has_normal_tex > 0) {
    normal = texture(u_material.Normal, fs_in.TexUV).rgb;
    normal = normalize(normal * 2.0 - 1.0);
  } else {
    normal = normalize(fs_in.Norm * 2.0 - 1.0);
  }
  vec3 view_dir = normalize(u_view_pos - fs_in.Pos);
  vec3 result;
  if (u_is_dir_light_on > 0) { result += CalculateDirLight(normal, view_dir); }
  int i = 0;
  for (i; i < u_num_point_lights_in_use; i++) { result += CalculatePointLights(u_point_lights[i], normal, view_dir); }
  for (i = 0; i < u_num_spot_lights_in_use; i++) { result += CalcSpotLight(u_spot_lights[i], normal, view_dir); }
  if (u_has_emission_tex > 0) {
    vec3 emission = texture(u_material.Emission, fs_in.TexUV).rgb;
    result += emission;
  }
  out_Color = vec4(result, 1.0);
}