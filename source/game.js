// You can use either `new PIXI.WebGLRenderer`, `new PIXI.CanvasRenderer`, or `PIXI.autoDetectRenderer`
// which will try to choose the best renderer for the environment you are in.
var renderer = new PIXI.WebGLRenderer(800, 600);
renderer.backgroundColor = 0xFFFFFF;
document.body.appendChild(renderer.view);
var stage = new PIXI.Container();


var character = new Character();
character.currentAnimation.play();

stage.addChild(character.currentAnimation);

draw();

function draw() {
    renderer.render(stage);
    requestAnimationFrame(draw);
}