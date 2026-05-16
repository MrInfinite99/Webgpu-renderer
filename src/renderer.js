import shaderCode from "../shaders/vertex.wgsl?raw";
import { UniformBuffer } from "./resources/buffers.js";
import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./camera";
import { Mesh } from "./resources/mesh"
import { Material } from "./resources/material"
import { Skybox } from "./resources/skybox.js"

class RenderObject {
    position;
    rotation;
    scale;

    modelMatrix;
    modelBuffer;
    uniformValues;
    objectBindGroup

    mesh;
    material;

    constructor(position, rotation, scale) {

        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.modelMatrix = mat4.create();

        this.createModelMatrix();


    }

    async init(device, pipeline, modelPath, materialOptions = {}) {
        this.mesh = await Mesh.load(device, modelPath);
        this.material = await Material.create(device, pipeline, materialOptions);
        this.createModelBuffer(device, pipeline);
    }

    createModelMatrix() {
        // Reset matrix
        mat4.identity(this.modelMatrix);

        // Translation
        mat4.translate(
            this.modelMatrix,
            this.modelMatrix,
            this.position
        );

        // Rotation
        mat4.rotateX(
            this.modelMatrix,
            this.modelMatrix,
            this.rotation[0]
        );

        mat4.rotateY(
            this.modelMatrix,
            this.modelMatrix,
            this.rotation[1]
        );

        mat4.rotateZ(
            this.modelMatrix,
            this.modelMatrix,
            this.rotation[2]
        );

        // Scale
        mat4.scale(
            this.modelMatrix,
            this.modelMatrix,
            this.scale
        );
    }

    createModelBuffer(device, pipeline) {
        this.uniformValues = new Float32Array(16);
        this.modelBuffer = new UniformBuffer(device, this.uniformValues);

        this.objectBindGroup =
            device.createBindGroup({

                layout:
                    pipeline.getBindGroupLayout(1),

                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer:
                                this.modelBuffer.buffer
                        }
                    }
                ]
            });
    }

    update(device) {
        this.createModelMatrix();
        this.uniformValues.set(this.modelMatrix, 0);

        this.modelBuffer.write(device, this.uniformValues, 0);

        this.material.update(device);
    }


    draw(device, pass) {

        pass.setBindGroup(1, this.objectBindGroup);
        this.material.bind(pass);
        this.mesh.draw(pass);
    }



}


export class Renderer {
    adapter;
    device;
    context;
    canvas;
    canvasFormat;
    pipeline;
    cameraBuffer;
    bindGroup;
    cameraUniformValues;
    vertexBuffer;
    indexBuffer;
    depthAttachment;
    startTime;
    camera;

    jelly;
    jelly2;
    jelly3;
    skybox;

    constructor(canvas) {
        this.canvas = canvas;
    }

    async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU not supported.");
        }

        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No GPU adapter found.");
        }

        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext("webgpu");
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.canvasFormat,
        });

        this.startTime = performance.now();

        this.camera = new Camera(this.canvas);
        this.jelly = new RenderObject(
            vec3.fromValues(0, 0, 0), // position
            vec3.fromValues(0, 1, 0), // rotation
            vec3.fromValues(1, 1, 1)  // scale
        );

        this.jelly2 = new RenderObject(
            vec3.fromValues(1, 1, 0), // position
            vec3.fromValues(0, 1, 90), // rotation
            vec3.fromValues(1, 1, 1)  // scale
        );

        this.jelly3 = new RenderObject(
            vec3.fromValues(1, -1, 1), // position
            vec3.fromValues(90, 1, 90), // rotation
            vec3.fromValues(1, 1, 1)  // scale
        );
        this.createDepthResources();
        await this.createPipeline();
        this.resizeObserver();

    }


    createDepthResources() {
        const depthTextureDesc = {
            size: [this.canvas.width, this.canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        };

        let depthTexture = this.device.createTexture(depthTextureDesc);
        let depthTextureView = depthTexture.createView()

        this.depthAttachment = {
            view: depthTextureView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'

        }

    }

    async createPipeline() {

        const shaderModule = this.device.createShaderModule({
            code: shaderCode,
        });

        const cameraBufferSize = 64; // 4x4 matrix (64 bytes) 
        this.cameraUniformValues = new Float32Array(16);



        this.cameraBuffer = new UniformBuffer(this.device, this.cameraUniformValues);




        this.pipeline = this.device.createRenderPipeline({
            label: "rectangle pipeline",
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "vs",
                buffers: [
                    {
                        arrayStride: 32,

                        attributes: [

                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x3"
                            },

                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: "float32x3"
                            },

                            {
                                shaderLocation: 2,
                                offset: 24,
                                format: "float32x2"
                            }
                        ]
                    },
                ],
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs",
                targets: [
                    {
                        format: this.canvasFormat,
                    },
                ],
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "none",
                frontFace: "ccw"
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus-stencil8'
            }
        });

        await this.jelly.init(this.device, this.pipeline, "/models/jelly.glb",
            {
                color: [0.6, 1, 1, 1],
                texturePath:
                    "/textures/test2.png"
            }
        )
        await this.jelly2.init(this.device, this.pipeline, "/models/jelly.glb",
            {
                color: [0, 1, 0, 1],
                texturePath:
                    "/textures/test2.png"
            }
        )

        await this.jelly3.init(this.device, this.pipeline, "/models/jelly.glb",
            {
                color: [1, 0.5, 1, 1],
                texturePath:
                    "/textures/test2.png"
            }
        )


        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.cameraBuffer.buffer,
                    },
                },
            ],
        });

        
        this.skybox = new Skybox(this.device);
        await this.skybox.init(this.device, this.cameraBuffer.buffer, this.canvasFormat, "/textures/skybox");
    }

    render() {
        const now = performance.now();
        const time = (now - this.startTime) / 1000; // Convert to seconds
        this.startTime = now;

        this.camera.processMovements(time);


        // Update uniform values
        this.cameraUniformValues.set(this.camera.vp, 0);
        this.jelly.update(this.device);
        this.jelly2.update(this.device);
        this.jelly3.update(this.device);


        const encoder = this.device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],

            depthStencilAttachment: this.depthAttachment
        });

        // Draw skybox first
        this.skybox.draw(pass);

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        this.jelly.draw(this.device, pass);
        this.jelly2.draw(this.device, pass);
        this.jelly3.draw(this.device,pass);
        pass.end();
        this.cameraBuffer.write(this.device, this.cameraUniformValues, 0);
        this.device.queue.submit([encoder.finish()]);

        requestAnimationFrame(() => this.render());
    }

    resizeObserver() {
        this.observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const dpr = window.devicePixelRatio || 1;
                this.canvas.width = entry.contentBoxSize[0].inlineSize * dpr;
                this.canvas.height = entry.contentBoxSize[0].blockSize * dpr;
            }
            this.createDepthResources();
        });
        this.observer.observe(this.canvas);
    }
}
