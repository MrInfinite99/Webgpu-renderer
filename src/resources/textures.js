export class Texture {

    texture;
    sampler;

    width;
    height;

    constructor(texture,sampler,view,width, height) {

        this.texture = texture;
        this.sampler = sampler;
        this.view = view;
       

        this.width = width;
        this.height = height;
    }

    static async load(device, url) {

        console.log(url);
        const response = await fetch(url);

        const blob = await response.blob();

        const imageBitmap =
            await createImageBitmap(blob);

        const textureDescriptor ={
            size: [
                    imageBitmap.width,
                    imageBitmap.height,
                    1
                ],

                format: "rgba8unorm",

                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT
        };

        
        const texture =device.createTexture(textureDescriptor);
             
        device.queue.copyExternalImageToTexture(

            { source: imageBitmap },

            { texture: texture },

            [
                imageBitmap.width,
                imageBitmap.height
            ]
        );

         
        const view =
            texture.createView();

        
        const sampler =
            device.createSampler({

                magFilter: "linear",
                minFilter: "linear",

                mipmapFilter: "linear",

                addressModeU: "repeat",
                addressModeV: "repeat",
            });

        return new Texture(
            texture,
            sampler,
            view,
            imageBitmap.width,
            imageBitmap.height
        );
    }

     
}
