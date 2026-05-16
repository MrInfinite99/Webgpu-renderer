import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { VertexBuffer, IndexBuffer } from "../buffers.js";

export class Mesh {
    vertexBuffer;
    indexBuffer;
    indexCount;
    constructor() {
        this.vertexBuffer = null;
        this.indexBuffer = null;
        this.indexCount = 0;
    }

    static async load(device, path) {
        const mesh = new Mesh();
        const loader = new GLTFLoader();

        const gltf = await loader.loadAsync(path);

        let found = null;

        gltf.scene.traverse((child) => {
            if (child.isMesh) found = child;
        });

        if (!found) throw new Error("No mesh found");

        const geometry = found.geometry;

        const positions = geometry.attributes.position.array;
        const normals = geometry.attributes.normal.array;

        const uvs = geometry.attributes.uv
            ? geometry.attributes.uv.array
            : new Float32Array((positions.length / 3) * 2);

        const indices = geometry.index.array;

        const vertexCount = positions.length / 3;
        const vertices = new Float32Array(vertexCount * 8);

        for (let i = 0; i < vertexCount; i++) {

            vertices[i * 8 + 0] = positions[i * 3 + 0];
            vertices[i * 8 + 1] = positions[i * 3 + 1];
            vertices[i * 8 + 2] = positions[i * 3 + 2];

            vertices[i * 8 + 3] = normals[i * 3 + 0];
            vertices[i * 8 + 4] = normals[i * 3 + 1];
            vertices[i * 8 + 5] = normals[i * 3 + 2];

            vertices[i * 8 + 6] = uvs[i * 2 + 0];
            vertices[i * 8 + 7] = uvs[i * 2 + 1];
        }

         mesh.vertexBuffer =
            new VertexBuffer(device, vertices);

        // Detect indices format (uint16 or uint32)
        const indexFormat = indices instanceof Uint32Array ? "uint32" : "uint16";

        mesh.indexBuffer =
            new IndexBuffer(
                device,
                indices,
                indexFormat
            );

        mesh.indexCount =
            indices.length;

         
        return mesh;

    }

    draw(pass) {

        pass.setVertexBuffer(
            0,
            this.vertexBuffer.buffer
        );

        pass.setIndexBuffer(
            this.indexBuffer.buffer,
            this.indexBuffer.format
        );

        pass.drawIndexed(this.indexCount);
    }
}
