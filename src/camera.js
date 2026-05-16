import { mat4, vec3 } from "gl-matrix";

export class Camera {
    proj;
    view;
 
    vp;
    aspect;

    constructor(canvas) {
        this.aspect = canvas.width / canvas.height;
        
        this.view = mat4.create();
        this.proj = mat4.create();
        this.vp = mat4.create();
 

    }

    update(time) {
 
        mat4.lookAt(
            this.view,
            [0, 0, 10

            ], // eye
            [0, 0, 0], // target
            [0, 1, 0]  // up
        );
        mat4.perspective(
            this.proj,
            Math.PI / 4,
            this.aspect,
            0.1,
            100.0
        );

        mat4.multiply(this.vp, this.proj, this.view);
        
    }
}
