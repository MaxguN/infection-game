function Level(name, renderer) {
	var self = this;

	this.json = {};
	this.window = {
		x : 0,
		y : 0,
		w : 800,
		h : 480
	};

	this.music = new Audio();
	this.tiles = {};
	this.tilesets = [];
	this.layers = [];
	this.colliders = [];
	this.width = 0;
	this.height = 0;
	this.tile = {
		width : 0,
		height : 0
	};

	this.origin = {x:0,y:0};
	this.character = {};
	this.end = -1;

	this.bullets = [];

	this.loaded = false;
	this.listeners = {
		ready : [],
		kill : [],
		loose : [],
		win : []
	};
	this.next = {
		ready : [],
		kill : []
	};

	this.ending = false;
	this.over = false;

	this.renderer = renderer;
	this.container = new PIXI.Container();

	this.container.scale = new PIXI.Point(1,1);

	load.json('levels/' + name + '.json', function (data) {self.Init(data);});
}

Level.prototype.Init = function(level) {
	var self = this;

	var characterid = -1;

	this.json = level;

	level.tilesets.forEach(function (tileset, index) {
		if (tileset.name === 'placeholders') {
			characterid = tileset.firstgid;
		} else {
			var uri = tileset.image;
			var texture = new Image();
			texture.src = uri

			this.tilesets[index] = {
				baseTexture : new PIXI.BaseTexture(texture),
				width : tileset.tilewidth,
				height : tileset.tileheight
			};

			for (var i = 0; i < tileset.imageheight; i += tileset.tileheight) {
				for (var j = 0; j < tileset.imagewidth; j += tileset.tilewidth) {
					this.tiles[tileset.firstgid + i / tileset.tileheight * (tileset.imagewidth / tileset.tilewidth) + j / tileset.tilewidth] = {
						x : j,
						y : i,
						set : index,
						texture : new PIXI.Texture(this.tilesets[index].baseTexture, new PIXI.Rectangle(j, i, tileset.tilewidth, tileset.tileheight))
					};
				}
			}
		}
	}, this);

	this.layers = level.layers;
	this.width = level.width;
	this.height = level.height;
	this.tile.width = level.tilewidth;
	this.tile.height = level.tileheight;

	this.layers.forEach(function (layer) {
		if (layer.visible) {
			layer.data.forEach(function (tileid, index) {
				if (tileid > 0) {
					var tile = new PIXI.Sprite(this.tiles[tileid].texture);
					var x = (index % this.width) * this.tile.width;
					var y = Math.floor(index / this.width) * this.tile.height;

					tile.position = new PIXI.Point(x, y);
					this.container.addChild(tile);

					this.colliders.push(new PIXI.Rectangle(x, y, this.tile.width, this.tile.height));
				}
			}, this);
		}
	}, this);

	level.layers.some(function (layer) {
		if (layer.name === 'Placeholders') {
			layer.data.forEach(function (tileid, index) {
				var x = index % layer.width;
				var y = Math.floor(index / layer.width);

				if (tileid === characterid) {
					this.origin.x = x * level.tilewidth;
					this.origin.y = y * level.tileheight;
					this.character = new Character(this.origin.x, this.origin.y, this);
				}
			}, this);

			return true;
		}
	}, this);

	// this.on('kill', function (type, fake) {
	// 	if (type === 'square') {
	// 		if (fake) {
	// 			self.square.x = self.origin.x;
	// 			self.square.y = self.origin.y;
	// 			self.updatecamera(self.origin.x, self.origin.y);
	// 		} else {
	// 			if (self.square.lives > 0) {
	// 				setTimeout(function () {
	// 					self.square.x = self.origin.x;
	// 					self.square.y = self.origin.y;
	// 					self.updatecamera(self.origin.x, self.origin.y);
	// 					self.square.dead = false;
	// 				}, 1000);
	// 			} else {
	// 				self.loose();
	// 			}
	// 		}
	// 	}
	// });


	this.loaded = true;
	this.listeners.ready.forEach(function (listener) {
		listener();
	});
	while (this.next.ready.length > 0) {
		(this.next.ready.shift())();
	}
};

Level.prototype.on = function(event, callback) {
	if (this.listeners[event]) {
		this.listeners[event].push(callback);
	}
};

Level.prototype.ready = function(callback) {
	if (!this.loaded) {
		this.next.ready.push(callback);
	} else {
		callback();
	}
};

Level.prototype.loose = function() {
	this.listeners.loose.forEach(function (listener) {
		listener();
	});
};

Level.prototype.win = function() {
	this.listeners.win.forEach(function (listener) {
		listener();
	});
};

Level.prototype.CenterCamera = function (point) {
	this.container.x = -Math.min(Math.max(0, point.x - this.renderer.width / 2), this.container.width - this.renderer.width);
	this.container.y = -Math.min(Math.max(0, point.y - this.renderer.height / 2), this.container.height - this.renderer.height);
}

Level.prototype.UpdateCamera = function(point) {
	var space = 32;

	if (-this.container.x > point.x + space - this.renderer.width / 2) { // left border
		this.container.x = -Math.min(Math.max(0, point.x + space - this.renderer.width / 2), this.container.width - this.renderer.width);
	} else if (-this.container.x < point.x - space - this.renderer.width / 2) { // right border
		this.container.x = -Math.min(Math.max(0, point.x - space - this.renderer.width / 2), this.container.width - this.renderer.width);
	}
 	
	this.container.y = -Math.min(Math.max(0, point.y - this.renderer.height / 2), this.container.height - this.renderer.height);
};

Level.prototype.Collides = function(x, y, width, height) {
	function intersectRectangles(rectangle1, rectangle2) {
		var r1 = {
			left : rectangle1.x,
			right : rectangle1.x + width,
			top : rectangle1.y,
			bottom : rectangle1.y + height
		};
		var r2 = {
			left : rectangle2.x,
			right : rectangle2.x + width,
			top : rectangle2.y,
			bottom : rectangle2.y + height
		};

		return !(r2.left > r1.right || 
				r2.right < r1.left || 
				r2.top > r1.bottom ||
				r2.bottom < r1.top);
	}

	var collides = false;
	var rectangle = new PIXI.Rectangle(x, y, width, height);
	var collisions = [];

	this.colliders.forEach(function (collider) {
		if (intersectRectangles(rectangle, collider)) {
			collides = true;
			collisions.push(collider);
		}
	}, this);

	return {
		collides : collides,
		colliders : collisions
	}
};

Level.prototype.RemoveBullet = function (bullet) {
	for (var i = 0; i < this.bullets.length; i += 1) {
		if (this.bullets[i] === bullet) {
			this.bullets.splice(i, 1);
			break;
		}
	}
}

// Level.prototype.checkfinish = function(x, y) {
// 	x = Math.floor(x / this.tile.width);
// 	y = Math.floor(y / this.tile.height);

// 	var index = y * this.width + x;

// 	if (this.finish[index]) {
// 		this.ending = true;
// 	}
// };

// Level.prototype.checkend = function(x, y) {
// 	var self = this;

// 	x = Math.floor(x / this.tile.width);
// 	y = Math.floor(y / this.tile.height);

// 	var index = y * this.width + x;

// 	if (this.end === index) {
// 		this.over = true;

// 		setTimeout(function () {
// 			self.win();
// 		}, 2000);
// 	}
// };

Level.prototype.Tick = function(length) {
	if (this.loaded) {
		// this.circles.forEach(function (circle) {
		// 	circle.tick(length);
		// }, this)
		// this.square.tick(length);

		// if (keydown[keys.r]) {
		// 	this.square.kill(true)
		// }
		var deltaTime = PIXI.ticker.shared.elapsedMS / 1000;

		this.character.Tick(deltaTime);
		this.bullets.forEach(function (bullet) {
			bullet.Tick(deltaTime);
		});

		this.Draw();
	}
};

Level.prototype.Draw = function() {	
	if (this.loaded) {
		this.renderer.render(this.container);
	}
};