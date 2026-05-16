import { Texture } from "./textures"
import { UniformBuffer } from "./buffers";

export class Material {
    color;
    texture;
    materialBuffer;
    uniformValues;
    bindGroup;

    constructor(device, color = [1, 1, 1, 1]) {
        this.color = new Float32Array(color);

        this.uniformValues =
            new Float32Array(4);

        this.uniformValues.set(
            this.color,
            0
        );

        this.materialBuffer = new UniformBuffer(device, this.uniformValues);
    }

    static async create(
        device,
        pipeline,
        options = {}
    ) {

        const material =
            new Material(
                device,
                options.color
            );

        // Optional texture
        if (options.texturePath) {

            material.texture =
                await Texture.load(
                    device,
                    options.texturePath
                );
        }

        material.createBindGroup(device, pipeline);

        return material;
    }

    createBindGroup(device, pipeline) {

        const entries = [

            {
                binding: 0,

                resource: {
                    buffer:
                        this.materialBuffer.buffer
                }
            }
        ];


        if (this.texture) {

            entries.push({

                binding: 1,

                resource:
                    this.texture.view
            });

            entries.push({

                binding: 2,

                resource:
                    this.texture.sampler
            });
        }

        this.bindGroup =
            device.createBindGroup({

                layout:
                    pipeline.getBindGroupLayout(2),
                entries
            });
    }

    update(device) {

        this.materialBuffer.write(
            device,
            this.uniformValues,
            0
        );
    }

    bind(pass) {

        pass.setBindGroup(
            2,
            this.bindGroup
        );
    }

    setColor(r, g, b, a = 1.0) {

        this.uniformValues[0] = r;
        this.uniformValues[1] = g;
        this.uniformValues[2] = b;
        this.uniformValues[3] = a;
    }

}
