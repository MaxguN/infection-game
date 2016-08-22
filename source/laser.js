function Laser(x, y, left, damage, level) {
	Animator.call(this, x, y, level.container);
	Collider.call(this, Tags.PlayerBullet, [
		Tags.Ennemy,
		Tags.EnnemyBullet,
		Tags.Objective
	]);

	var self = this;

	this.speed = 512; // pixels/second
	this.damage = damage;

	this.level = level;

	if (left) {
		this.speed = -this.speed
	}

	load.json('animations/laser.json', function (data) {self.Init(data);});
}

Laser.prototype = Object.create(Animator.prototype);
Laser.prototype.constructor = Laser;

Laser.prototype.Collides = function (delta) {
	var x = this.x + delta.x;
	var y = this.y + delta.y;
	var width = this.currentAnimation.width;
	var height = this.currentAnimation.height;

	var collisions = this.level.Collides(this.GetRectangle());

	if (collisions.collides) {
		this.level.RemoveObject(this);
		this.Erase();
	}
}

Laser.prototype.Tick = function (length) {
	if (this.isLoaded) {
		var delta = {
			x : this.speed * length,
			y : 0
		}

		this.Collides(delta, length);

		this.x += delta.x;
		this.currentAnimation.position.x = this.x;
	}
}