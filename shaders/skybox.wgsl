struct Uniforms {
    vp: mat4x4<f32>,
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(1) @binding(0)
var skybox_texture: texture_cube<f32>;

@group(1) @binding(1)
var skybox_sampler: sampler;

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) pos: vec3f,
};

@vertex
fn vs(@location(0) position: vec3f) -> VSOut {
    var out: VSOut;
    
    out.position = (uniforms.vp * vec4f(position, 1.0)).xyww; // Keep depth at 1.0 (far plane)
    out.pos=position;
    return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
    return textureSample(skybox_texture, skybox_sampler, in.pos);
}
