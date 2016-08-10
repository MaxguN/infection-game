function Potion(x, y, level) {
	Animator.call(this, x, y, level.container);

	var self = this;

	this.level = level;

	load.json('animations/potion.json', function (data) {self.Init(data);});
}

Potion.prototype = Object.create(Animator.prototype);
Potion.prototype.constructor = Potion;

Potion.prototype.Collides = function () {
	var x = this.x + delta.x + direction * this.currentAnimation.width + 1;
	var y = this.y + delta.y + this.currentAnimation.height;
	var width = this.currentAnimation.width / 2;
	var height = this.currentAnimation.height;

	var collisions = this.level.Collides(x, y, width, height);
}

Potion.prototype.Tick = function (length) {
	if (this.isLoaded) {
		this.Collides();
	}
}