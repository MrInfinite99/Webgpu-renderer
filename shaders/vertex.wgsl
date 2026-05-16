struct Uniforms {
    vp:mat4x4<f32>,
};

struct MeshUniform {
    model : mat4x4<f32>
}

struct MaterialUniform{
    color :vec4f
};



@group(0) @binding(0)//camera
var<uniform> uniforms: Uniforms;

@group(1) @binding(0)//object
var<uniform> object : MeshUniform;

@group(2) @binding(0)
var<uniform> material : MaterialUniform;

@group(2) @binding(1)
var tex : texture_2d<f32>;

@group(2) @binding(2)
var samp : sampler;

struct VSOut{
    @builtin(position) position:vec4f,
    @location(0) normal :vec3f,
    @location(1) uv:vec2f,
}

@vertex
fn vs(
    @location(0) position : vec3f,
    @location(1) normal : vec3f,
    @location(2) uv : vec2f
) -> VSOut {
    var out:VSOut;

    out.position =uniforms.vp *object.model*vec4f(position,1.0);
    out.normal=normalize((object.model*vec4f(normal,0.0)).xyz);

    return out;
    
}

@fragment
fn fs(input : VSOut) -> @location(0) vec4f {
     let lightDir =
        normalize(vec3f(1.0, 1.0, 1.0));

    let N =
        normalize(input.normal);

    let diffuse =
        max(dot(N, lightDir), 0.0);

    let ambient = 0.1;

    let lighting =
        diffuse + ambient;
    
    let texColor =
    textureSample(
        tex,samp,input.uv
    );





    return vec4f(
        texColor.rgb*
        material.color.rgb*
        lighting,
        texColor.a
    );
}
