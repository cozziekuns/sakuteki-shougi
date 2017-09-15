//=============================================================================
// ** Sprite_Board
//=============================================================================

function Sprite_Board() {
    this.initialize.apply(this, arguments);
};

Sprite_Board.FILEPATH = 'img/board.png';

Object.defineProperties(Sprite_Board.prototype, {
    x: { 
        get: function() { return this._sprite.x; },
        set: function(value) { this._sprite.x = value; },
    },
    y: { 
        get: function() { return this._sprite.y; },
        set: function(value) { this._sprite.y = value; },
    },
});

Sprite_Board.prototype.initialize = function() {
    this._sprite = PIXI.Sprite.fromImage(Sprite_Board.FILEPATH);
    Game.context.stage.addChild(this._sprite);
};

//=============================================================================
// ** Sprite_Piece
//=============================================================================

function Sprite_Piece() {
    this.initialize.apply(this, arguments);
};

Sprite_Piece.prototype = Object.create(PIXI.Sprite.prototype);
Sprite_Piece.prototype.constructor = Sprite_Piece;

Sprite_Piece.FILEPATH = 'img/pieces.png';

Sprite_Piece.prototype.initialize = function(object) {
    this._object = object;
    this._createSprite();
    this._updateFrame();
    Game.context.stage.addChild(this._sprite);
};

Sprite_Piece.prototype.alignToObject = function() {
    this._sprite.x = this._object.screenX();
    this._sprite.y = this._object.screenY();
};

Sprite_Piece.prototype._createSprite = function() {
    var baseTexture = PIXI.loader.resources[Sprite_Piece.FILEPATH].texture;
    var texture = new PIXI.Texture(baseTexture);

    this._sprite = new PIXI.Sprite(texture);
    this.alignToObject();
};

Sprite_Piece.prototype._updateFrame = function() {
    var frameX = this._object.id * 64;
    var frameY = this._object.alliance * 128 + (this._object.promoted ? 64 : 0);

    this._sprite.texture.frame = new PIXI.Rectangle(frameX, frameY, 64, 64);
};
