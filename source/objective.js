function Objective(x, y, level) {
	Animator.call(this, x, y, level.container);

	var self = this;

	this.speed = 128; // pixels/second
	this.rateOfFire = 1; // shoots / second

	this.delayShoot = 1 / this.rateOfFire; // seconds
	this.timerShoot = 0;

	this.shotCount = 0;
	this.shotThreshold = 10;

	this.level = level;

	load.json('animations/objective.json', function (data) {self.Init(data);});
}

Objective.prototype = Object.create(Animator.prototype);
Objective.prototype.constructor = Objective;

Objective.prototype.Collides = function (delta) {
	var direction = (this.speed / Math.abs(this.speed));

	var x = this.x + delta.x + direction * this.currentAnimation.width + 1;
	var y = this.y + delta.y + this.currentAnimation.height;
	var width = this.currentAnimation.width / 2;
	var height = this.currentAnimation.height;

	var collisions = this.level.Collides(x, y, width, height);
}

Objective.prototype.Tick = function (length) {
	if (this.isLoaded) {
		this.Collides(delta);
	}
}