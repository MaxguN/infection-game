function Character(x, y, level) {
	Animator.call(this, x, y, level.container);

	var self = this;

	this.vy = 0;

	this.speed = 384; // pixels/second
	this.vspeed = 1024;
	this.gravity = 4096;
	this.rateOfFire = 5; // shoots / second

	this.delayShoot = 1 / this.rateOfFire; // seconds
	this.timerShoot = 0;

	this.shotCount = 0;
	this.shotThreshold = 10;

	this.level = level;

	this.on('load', function () {
		self.level.CenterCamera(self.GetCenter());
	})

	load.json('animations/character.json', function (data) {self.Init(data);});
}

Character.prototype = Object.create(Animator.prototype);
Character.prototype.constructor = Character;

Character.prototype.Collides = function (delta, length) {
	var collisions;

	var x;
	var y;
	var width = this.currentAnimation.width;
	var height = this.currentAnimation.height;

	if (this.mirrored) {
		x = this.x + delta.x - this.currentAnimation.width;
		y = this.y + delta.y;
	} else {
		x = this.x + delta.x;
		y = this.y + delta.y;
	}

	// console.log(x +  ',' + y + ' | ' + width +'x' + height);

	collisions = this.level.Collides(x, y, width, height);

	if (collisions.collides) {
		collisions.colliders.forEach(function (collider) {
			var under = collider.y - (this.y + delta.y + this.currentAnimation.height);
			// console.log(collider.y + ' < ' + (this.y + this.currentAnimation.height));
			if (under < 0) {
				if (under < -(this.level.tile.height / 2)) {
					if (delta.x < 0) {
						var dx = (collider.x + collider.width - (this.x - this.currentAnimation.width))

						if (dx > delta.x) {
							delta.x = dx;
						}
					} else if (delta.x > 0) {
						var dx = collider.x - (this.x + this.currentAnimation.width);

						if (dx < delta.x) {
							delta.x = dx;
						}
					}
				}

				if (this.x + delta.x <= collider.x + this.level.tile.width || this.x + delta.x + this.currentAnimation.width >= collider.x) {
					var dy = collider.y - (this.y + this.currentAnimation.height);

					if (dy < delta.y && Math.abs(dy) < this.level.tile.height / 2) {
						delta.y = dy;
						this.vy = 0;
					}

				}
			}
		}, this);
	} else if (this.vy === 0) {
		this.vy = -(this.gravity * length);
		this.SwitchToAnim('falling', this.mirrored);
	}

	return delta;
}

Character.prototype.Tick = function (length) {
	if (this.isLoaded) {
		var delta = {
			x : 0,
			y : 0
		}

		if (keydown[keys.left]) {
			delta.x -= this.speed * length;
			if (this.timerShoot > 0) {
				this.SwitchToAnim('shootrunning', true);
			} else {
				this.SwitchToAnim('running', true);
			}
		}

		if (keydown[keys.right]) {
			delta.x += this.speed * length;
			if (this.timerShoot > 0) {
				this.SwitchToAnim('shootrunning');
			} else {
				this.SwitchToAnim('running');
			}
		}

		if (keydown[keys.x] && this.vy === 0) {
			this.vy = this.vspeed;
			if (this.timerShoot > 0) {
				this.SwitchToAnim('shootjumping', this.mirrored);
			} else {
				this.SwitchToAnim('jumping', this.mirrored);
			}
		}

		if (this.vy !== 0) {
			delta.y = -(this.vy * length);
			this.vy -= this.gravity * length;

			if (this.vy < 0) {
				if (this.timerShoot > 0) {
					this.SwitchToAnim('shootfalling', this.mirrored);
				} else {
					this.SwitchToAnim('falling', this.mirrored);
				}
			}
		}

		delta = this.Collides(delta, length);

		if (!delta.x && !delta.y) {
			if (this.timerShoot > 0) {
				this.SwitchToAnim('shooting', this.mirrored);
			} else {
				this.SwitchToAnim('idle', this.mirrored);
			}
		}

		if (keydown[keys.c] && this.timerShoot <= 0) {
			switch (this.currentAnimationName) {
				case ('idle') :
					this.SwitchToAnim('shooting', this.mirrored);
					break;
				case ('running') :
					this.SwitchToAnim('shootrunning', this.mirrored);
					break;
				case ('jumping') :
					this.SwitchToAnim('shootjumping', this.mirrored);
					break;
				case ('falling') :
					this.SwitchToAnim('shootfalling', this.mirrored);
					break;
			}

			var offset = this.currentAnimation.texture.points[0];

			console.log(offset)

			var x = this.x + (this.mirrored ? -1 : 1) * offset.x;
			var y = this.y + offset.y;

			this.level.bullets.push(new Laser(x, y, this.mirrored, this.state, this.level));
			this.shotCount += 1;

			this.currentState = Math.min(Math.floor(this.shotCount / this.shotThreshold), 3);
			this.UpdateAnim(this.currentAnimationName, this.mirrored);

			this.timerShoot = this.delayShoot;
		}

		this.x += delta.x;
		this.y += delta.y;

		this.currentAnimation.position.x = this.x;
		this.currentAnimation.position.y = this.y;

		this.level.UpdateCamera(this.GetCenter());

		if (this.timerShoot > 0) {
			this.timerShoot -= length;
		}

		// console.log(this.currentAnimation.texture.points);
	}
}