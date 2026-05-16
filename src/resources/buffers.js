export class UniformBuffer {
    buffer;
    data;

    constructor(device, data) {
        this.data = data;
        const size = Math.ceil(data.byteLength / 4) * 4;
        this.buffer = device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this.buffer, 0, this.data);
    }

    write(device, data, offset = 0) {
        this.data = data;
        device.queue.writeBuffer(this.buffer, offset, data);
    }
}

export class VertexBuffer {
    buffer;
    data;

    constructor(device, vertices, usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
        this.data = vertices;
        const size = Math.ceil(vertices.byteLength / 4) * 4;
        this.buffer = device.createBuffer({
            size,
            usage,
        });
        device.queue.writeBuffer(this.buffer, 0, this.data);
    }

    write(device, data, offset = 0) {
        this.data = data;
        device.queue.writeBuffer(this.buffer, offset, data);
    }
}

export class IndexBuffer {
    buffer;
    data;
    count;
    format;

    constructor(
        device,
        indices,
        format = "uint16",
        usage = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    ) {
        this.data = indices;
        this.count = indices.length;
        this.format = format;
        const size = Math.ceil(indices.byteLength / 4) * 4;
        this.buffer = device.createBuffer({
            size,
            usage,
        });
        device.queue.writeBuffer(this.buffer, 0, this.data);
    }

    write(device, indices, offset = 0) {
        this.data = indices;
        this.count = indices.length;
        device.queue.writeBuffer(this.buffer, offset, indices);
    }
}
