function Collider(tag, whitelist) {
	this.colliderTag = tag;
	this.colliderWhitelist = whitelist;
}

var Tags = {
	Player : 'player',
	PlayerBullet : 'player bullet',
	Ennemy : 'ennemy',
	EnnemyBullet : 'ennemy bullet',
	Potion : 'potion',
	Objective : 'objective'
}