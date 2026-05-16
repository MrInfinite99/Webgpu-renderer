import { mat4, vec3 } from "gl-matrix";

export class Camera {
    proj;
    view;

    vp;
    aspect;

    position;
    front;
    up;
    right;
    worldUp;

    yaw;
    pitch;

    speed;
    sensitivity;

    constructor(canvas) {
        this.aspect = canvas.width / canvas.height;

        this.view = mat4.create();
        this.proj = mat4.create();
        this.vp = mat4.create();

        // Camera vectors
        this.position = vec3.fromValues(0, 0, 10);
        this.front = vec3.fromValues(0, 0, -1);
        this.worldUp = vec3.fromValues(0, 1, 0);

        this.up = vec3.create();
        this.right = vec3.create();


        this.yaw = -90;
        this.pitch = 0.0;

        // Movement
        this.speed = 5.0;
        this.sensitivity = 0.1;

        this.keys = {};

        this.updateCameraVectors();


        window.addEventListener("keydown", (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });


        canvas.addEventListener("mousemove", (e) => {
            if (!document.pointerLockElement) return;

            this.yaw += e.movementX * this.sensitivity;
            this.pitch -= e.movementY * this.sensitivity;

            // Clamp pitch
            this.pitch = Math.max(
                -89,
                Math.min(89, this.pitch)
            );

            this.updateCameraVectors();
        });

        canvas.addEventListener("click", () => {
            canvas.requestPointerLock();
        });
    }

    processMovements(deltaTime) {
        this.update(deltaTime);

        const target = vec3.create();
        vec3.add(target, this.position, this.front);  

        mat4.lookAt(
            this.view,
            this.position,  
            target,          
            this.up          
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

    update(deltaTime) {
        const velocity =
            this.speed * deltaTime;

        // Forward
        if (this.keys["w"]) {
            const move = vec3.create();
            vec3.scale(move, this.front, velocity);
            vec3.add(this.position, this.position, move);
        }

        // Backward
        if (this.keys["s"]) {
            const move = vec3.create();
            vec3.scale(move, this.front, velocity);
            vec3.sub(this.position, this.position, move);
        }

        // Left
        if (this.keys["a"]) {
            const move = vec3.create();
            vec3.scale(move, this.right, velocity);
            vec3.sub(this.position, this.position, move);
        }

        // Right
        if (this.keys["d"]) {
            const move = vec3.create();
            vec3.scale(move, this.right, velocity);
            vec3.add(this.position, this.position, move);
        }

        // Up
        if (this.keys[" "]) {
            const move = vec3.create();
            vec3.scale(move, this.worldUp, velocity);
            vec3.add(this.position, this.position, move);
        }

        // Down
        if (this.keys["shift"]) {
            const move = vec3.create();
            vec3.scale(move, this.worldUp, velocity);
            vec3.sub(this.position, this.position, move);
        }
    }

    updateCameraVectors() {
        const front = vec3.fromValues(
            Math.cos(this.toRad(this.yaw)) *
            Math.cos(this.toRad(this.pitch)),

            Math.sin(this.toRad(this.pitch)),

            Math.sin(this.toRad(this.yaw)) *
            Math.cos(this.toRad(this.pitch))
        );

        vec3.normalize(this.front, front);

        vec3.cross(
            this.right,
            this.front,
            this.worldUp
        );
        vec3.normalize(this.right, this.right);

        vec3.cross(
            this.up,
            this.right,
            this.front
        );
        vec3.normalize(this.up, this.up);
    }

    toRad(deg) {
        return deg * Math.PI / 180;
    }
}
