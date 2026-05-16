import skyboxShaderCode from "../../shaders/skybox.wgsl?raw";
import { VertexBuffer, IndexBuffer } from "./buffers.js";

export class Skybox {

    pipeline
    bindGroup;
    cubemapBindGroup;
    texture;
    sampler;
    vertexBuffer;
    indexBuffer;
    indexCount;

    constructor(device) {
        this.device = device;
    }

    async init(device, cameraBuffer, canvasFormat, cubemapPath) {

        this.createCubeMesh(device);


        await this.loadCubemap(device, cubemapPath);


        const shaderModule = device.createShaderModule({
            code: skyboxShaderCode,
        });


        this.pipeline = device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "vs",
                buffers: [{
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x3"
                    }]
                }],
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs",
                targets: [{
                    format: canvasFormat,
                }],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "none",
                frontFace: "ccw"
            },
            depthStencil: {
                depthCompare: 'always',
                depthWriteEnabled: false,
                format: 'depth24plus-stencil8'
            }
        });


        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',

        });


        this.bindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: cameraBuffer }
            }]
        });


        this.cubemapBindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: this.texture.createView({ dimension: 'cube' }) },
                { binding: 1, resource: this.sampler }
            ]
        });
    }

    createCubeMesh(device) {
        const size = 1000; // Large skybox cube to prevent edge clipping
        const positions = new Float32Array([
            // Back
            -size, -size, -size,
            size, -size, -size,
            size, size, -size,
            -size, size, -size,
            // Front
            -size, -size, size,
            size, -size, size,
            size, size, size,
            -size, size, size,
            // Top
            -size, size, -size,
            size, size, -size,
            size, size, size,
            -size, size, size,
            // Bottom
            -size, -size, -size,
            size, -size, -size,
            size, -size, size,
            -size, -size, size,
            // Right
            size, -size, -size,
            size, -size, size,
            size, size, size,
            size, size, -size,
            // Left
            -size, -size, -size,
            -size, -size, size,
            -size, size, size,
            -size, size, -size,
        ]);

        const indices = new Uint32Array([
            0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 8, 10, 9, 8, 11, 10, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 22, 21, 20, 23, 22
        ]);

        this.vertexBuffer = new VertexBuffer(device, positions);
        this.indexBuffer = new IndexBuffer(device, indices, "uint32");
        this.indexCount = this.indexBuffer.count;
    }

    async loadCubemap(device, cubemapPath) {
        const faces = ['right', 'left', 'top', 'bottom', 'front', 'back'];
        const bitmaps = [];

        for (const face of faces) {
            const img = await this.loadImage(`${cubemapPath}/${face}.jpg`);

            const bitmap = await createImageBitmap(img, {
                colorSpaceConversion: 'none'
            });
            bitmaps.push(bitmap);
        }

        this.texture = device.createTexture({
            dimension: '2d',
            size: [bitmaps[0].width, bitmaps[0].height, 6],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        for (let i = 0; i < 6; i++) {
            device.queue.copyExternalImageToTexture(
                { source: bitmaps[i], flipY: false },
                { texture: this.texture, origin: [0, 0, i] },
                [bitmaps[i].width, bitmaps[i].height]
            );
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    draw(pass) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setBindGroup(1, this.cubemapBindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer.buffer);
        pass.setIndexBuffer(this.indexBuffer.buffer, this.indexBuffer.format);
        pass.drawIndexed(this.indexCount);
    }
}
