import {Renderer} from "./renderer.js"

const canvas =document.querySelector("canvas");

canvas.width =window.innerWidth;
canvas.height =window.innerHeight;

const renderer = new Renderer(canvas);

await renderer.init();


renderer.render();
