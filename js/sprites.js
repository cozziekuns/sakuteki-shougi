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
    this.object = object;
    this._active = false;
    this._createSprite();
    this._updateFrame();
    Game.context.stage.addChild(this._sprite);
};

Sprite_Piece.prototype.isActive = function() {
    return this._active;
};

Sprite_Piece.prototype.activate = function() {
    this._active = true;
};

Sprite_Piece.prototype.deactivate = function() {
    this._active = false;
};

Sprite_Piece.prototype.alignToObject = function() {
    this._sprite.x = this.object.screenX();
    this._sprite.y = this.object.screenY();
};

Sprite_Piece.prototype._createSprite = function() {
    var baseTexture = PIXI.loader.resources[Sprite_Piece.FILEPATH].texture;
    var texture = new PIXI.Texture(baseTexture);

    this._sprite = new PIXI.Sprite(texture);
    this._sprite.parentObj = this;
    this._sprite.interactive = true;
    this._sprite.on('pointerdown', this._onButtonDown);
    this._sprite.on('mousemove', this._onMouseMove);
    this.alignToObject();
};

Sprite_Piece.prototype._updateFrame = function() {
    var frameX = this.object.id * 64;
    var frameY = this.object.alliance * 128 + (this.object.promoted ? 64 : 0);

    this._sprite.texture.frame = new PIXI.Rectangle(frameX, frameY, 64, 64);
};

Sprite_Piece.prototype._onButtonDown = function() {
    var mousePosition = Game.context.renderer.plugins.interaction.mouse.global;
    if (this.parentObj.isActive()) {
        var piece = this.parentObj.object;
        var localX = (mousePosition.x - (Game.WINDOW_WIDTH - 576) / 2);
        var localY = (mousePosition.y - (Game.WINDOW_HEIGHT - 576) / 2);
        var destX = Math.floor(localX / 64);
        var destY = Math.floor(localY / 64);

        var actionList = new Game_ActionList(piece, destX, destY);
        if (actionList.isValid()) {
            if (piece.canPromote(destX, destY)) {
                /* TODO:
                if (Dialog_Promotion.show(piece)) {
                    var action = new Game_Action(piece, 'promote');
                    this.actionList.addAction(action)
                }
                */
            }

            BattleManager.requestAction(actionList);
        }

        this.parentObj.alignToObject();
        this.parentObj.deactivate();
    } else {
        this.x = mousePosition.x - this.width / 2;
        this.y = mousePosition.y - this.height / 2;
        
        this.parentObj.activate();
        Game.pushToFront(this);
    }
};

Sprite_Piece.prototype._onMouseMove = function() {
    if (!this.parentObj.isActive()) {
        return;
    }

    var mousePosition = Game.context.renderer.plugins.interaction.mouse.global;
    this.x = mousePosition.x - this.width / 2;
    this.y = mousePosition.y - this.height / 2;
};