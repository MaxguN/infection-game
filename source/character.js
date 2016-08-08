function Character(x, y, level) {
	var self = this;

	this.x = x;
	this.y = y;

	this.vy = 0;

	this.speed = 384; // pixels/second
	this.vspeed = 576;
	this.gravity = 2048;

	this.tiles = [];
	this.tilesets = [];
	this.animations = [];
	this.currentAnimation = null;
	this.mirrored = false;
	this.currentState = 0;

	this.level = level;
	this.container = level.container;

	this.isLoaded = false;

	this.listeners = {};

	load.json('animations/character.json', function (data) {self.Init(data);});
}

Character.prototype.Init = function (data) {
	var self = this;


	data.tilesets.forEach(function (tileset, set) {
		var stateTiles = [];
		var index;
		var texture = new Image();
		texture.src = 'textures/' + tileset.file

		this.tilesets[set] = {
			baseTexture : new PIXI.BaseTexture(texture),
			width : tileset.tilewidth,
			height : tileset.tileheight
		};

		this.tiles[0] = [];
		stateTiles = this.tiles[0];

		for (var i = 0; i < tileset.imagewidth; i += tileset.tilewidth) {
			if (data.stateful) {
				this.tiles[i / tileset.tilewidth] = [];
				stateTiles = this.tiles[this.tiles.length - 1];
			}
			for (var j = 0; j < tileset.imageheight; j += tileset.tileheight) {
				if (data.stateful) {
					index = tileset.firstgid + j / tileset.tileheight;
				} else {
					index = tileset.firstgid + j / tileset.tileheight + i / tileset.tilewidth * (tileset.imageheight / tileset.tileheight);
				}
				
				stateTiles[index] = {
					texture : new PIXI.Texture(this.tilesets[set].baseTexture, new PIXI.Rectangle(i, j, tileset.tilewidth, tileset.tileheight)),
					set : set
				};
			}
		}

	}, this);

	var textureSet = [];
	var stateCount = 1;

	if (data.stateful) {
		stateCount = data.states;
	}

	for (var state = 0; state < stateCount; state += 1) {
		this.animations[state] = {};

		for (var animation in data.animations) {
			textureSet = [];

			data.animations[animation].frames.forEach(function (frame) {
				textureSet.push(this.tiles[state][frame.tile].texture);
			}, this);

			this.animations[state][animation] = new PIXI.extras.MovieClip(textureSet);
			this.animations[state][animation].animationSpeed = 0.15;
		}
	}

	console.log(data.default);

	this.currentAnimation = this.animations[this.currentState][data.default];
	this.currentAnimation.position = new PIXI.Point(this.x, this.y);
	this.currentAnimation.play();

	this.container.addChild(this.currentAnimation);

	this.loaded();
}

Character.prototype.addListener = function (eventType, callback) {
	if (!this.listeners[eventType]) {
		this.listeners[eventType] = [];
	}

	this.listeners[eventType].push(callback);
}

Character.prototype.loaded = function () {
	this.isLoaded = true;

	if (this.listeners['load']) {
		this.listeners['load'].forEach(function (callback) {
			callback();
		}, this);
	}
}

Character.prototype.SwitchToAnim = function (animation, mirror) {
	mirror = !(!mirror);

	if (this.animations[this.currentState][animation]) {
		if (this.animations[this.currentState][animation] !== this.currentAnimation || mirror !== this.mirrored) {
			this.container.removeChild(this.currentAnimation);

			this.currentAnimation = this.animations[this.currentState][animation];	
			this.currentAnimation.position = new PIXI.Point(this.x, this.y);

			this.MirrorAnim(mirror);

			this.currentAnimation.play();

			this.container.addChild(this.currentAnimation);
		}
	}
}

Character.prototype.MirrorAnim = function (mirror) {
	mirror = !(!mirror);

	if (mirror) {
		if (!this.mirrored) {
			this.x += this.currentAnimation.width;
		}

		this.currentAnimation.scale.x = -1
	} else {
		if (this.mirrored) {
			this.x -= this.currentAnimation.width;
		}

		this.currentAnimation.scale.x = 1;
	}

	this.mirrored = mirror;
}

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
			this.SwitchToAnim('running', true);
		}

		if (keydown[keys.right]) {
			delta.x += this.speed * length;
			this.SwitchToAnim('running');
		}

		if (keydown[keys.space] && this.vy === 0) {
			this.vy = this.vspeed;
			this.SwitchToAnim('jumping', this.mirrored);
		}

		if (this.vy !== 0) {
			delta.y = -(this.vy * length);
			this.vy -= this.gravity * length;

			if (this.vy < 0) {
				this.SwitchToAnim('falling', this.mirrored);
			}
		}

		delta = this.Collides(delta, length);

		if (!delta.x && !delta.y) {
			this.SwitchToAnim('idle', this.mirrored);
		}

		this.x += delta.x;
		this.y += delta.y;

		this.currentAnimation.position.x = this.x;
		this.currentAnimation.position.y = this.y;

	}
}