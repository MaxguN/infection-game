function Character() {
	var self = this;

	this.tiles = [];
	this.tilesets = [];
	this.animations = [];
	this.currentAnimation = null;

	load.json('animations/character.json', function (data) {self.Init(data);});
}

Character.prototype.Init = function (data) {
	var self = this;

	data.tilesets.forEach(function (tileset, set) {
		var stateTiles = [];
		var index;

		this.tilesets[set] = {
			baseTexture : new PIXI.BaseTexture('images/' + tileset.file),
			width : tileset.tilewidth,
			height : tileset.tileheight
		}

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
		}
	}

	this.currentAnimation = this.animations[0][data.default];
}