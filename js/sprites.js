//=============================================================================
// ** Sprite_Fog
//=============================================================================

function Sprite_Fog() {
    this.initialize.apply(this, arguments);
};

Object.defineProperties(Sprite_Fog.prototype, {
    sprite: { get: function() { return this._sprite; } },
});

Sprite_Fog.prototype.initialize = function(x, y) {
    this._x = x;
    this._y = y;
    this._createSprite();
    Game.context.stage.addChild(this._sprite);
};

Sprite_Fog.prototype._createSprite = function() {
    this._sprite = new PIXI.Graphics();
    this._sprite.x = (Game.WINDOW_WIDTH - 576) / 2 + this._x * 64;
    this._sprite.y = (Game.WINDOW_HEIGHT - 576) / 2 + this._y * 64;

    this._sprite.beginFill(0x808080);
    this._sprite.drawRect(0, 0, 64, 64);
    this._sprite.endFill();
};

Sprite_Fog.prototype.refresh = function() {
    if (BattleManager.playerFog.isFog(this._x, this._y)) {
        this._sprite.alpha = 0.5;
    } else {
        this._sprite.alpha = 0;
    }
};

//=============================================================================
// ** Sprite_Piece
//=============================================================================

function Sprite_Piece() {
    this.initialize.apply(this, arguments);
};

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
    this._updateFrame();
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
    var piece = this.parentObj.object;

    if (this.parentObj.isActive()) {
        var localX = (mousePosition.x - (Game.WINDOW_WIDTH - 576) / 2);
        var localY = (mousePosition.y - (Game.WINDOW_HEIGHT - 576) / 2);
        var destX = Math.floor(localX / 64);
        var destY = Math.floor(localY / 64);

        var actionList = new Game_ActionList(piece, destX, destY);

        var checkForPromote = false;
        if (actionList.isValid() && piece.onBoard() && piece.canPromote(destY)) {
            checkForPromote = !piece.mustPromote(destX, destY);
        }

        Game.processEvent(actionList, checkForPromote);
        this.parentObj.deactivate();
    } else {
        if (!BattleManager.isPlayerTurn() || BattleManager.turn != piece.alliance) {
            return;
        }

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

//=============================================================================
// ** Sprite_PieceCount
//=============================================================================

function Sprite_PieceCount() {
    this.initialize.apply(this, arguments);
}

Sprite_PieceCount.prototype.initialize = function(alliance) {
    this._alliance = alliance;
    this._createSprite();
    Game.context.stage.addChild(this._sprite);
};

Sprite_PieceCount.prototype._createSprite = function() {
    var xOffset = (this._alliance == 0 ? -96 : 576 + 80);

    this._sprite = new PIXI.Graphics();
    this._sprite.x = (Game.WINDOW_WIDTH - 576) / 2 + xOffset;
    this._sprite.y = (Game.WINDOW_HEIGHT - 576) / 2 + 32;
};

Sprite_PieceCount.prototype.refresh = function() {
    for (var i = this._sprite.children.length - 1; i >= 0; i--) {
        this._sprite.removeChild(this._sprite.children[i]);
    }

    for (var i = 0; i < 8; i++) {
        var count = BattleManager.board.capturedPiecesCount(i, this._alliance);
        if (count == 0) {
            continue;
        }

        this.drawText(count.toString(), 0, i * 64);
    }
};

Sprite_PieceCount.prototype.drawText = function(text, x, y) {
    var textSprite = new PIXI.Text(text, {
        fill: ['#FFFFFF'],
        fontFamily: 'Helvetica',
        fontSize: 24,
    });
    textSprite.x = x;
    textSprite.y = y;
    
    this._sprite.addChild(textSprite);
};

//=============================================================================
// ** Sprite_Button
//=============================================================================

function Sprite_Button() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Sprite_Button.prototype, {
    sprite: { get: function() { return this._sprite; } },
});

Sprite_Button.prototype.initialize = function(x, y, width, height, text, callback) {
    this.callback = callback;
    this.backgroundColour = 0xFFFFFF;
    this.textFill = ['#000000'];

    this._width = width;
    this._height = height;
    this._text = text;

    this._createSprite(x, y, text);
};

Sprite_Button.prototype._createSprite = function(x, y, text) {
    this._sprite = new PIXI.Graphics();
    this._sprite.parentObj = this;
    this._sprite.x = x;
    this._sprite.y = y;

    this._sprite.interactive = true;
    this._sprite.on('pointerdown', this._onButtonDown);
    this._sprite.on('pointerup', this._onButtonUp);
    this._sprite.on('pointerover', this._onButtonOver);
    this._sprite.on('pointerout', this._onButtonOut);

    this.drawBackground();
    this.drawText();
};

Sprite_Button.prototype.drawBackground = function() {
    this._sprite.lineStyle(1, 0x808080, 1);
    this._sprite.beginFill(this.backgroundColour);
    this._sprite.drawRect(0, 0, this._width, this._height);
    this._sprite.endFill();
};

Sprite_Button.prototype.drawText = function(text) {
    if (this._sprite.children.length > 0) {
        this._sprite.removeChild(this._sprite.children[0]);
    }

    var textSprite = new PIXI.Text(this._text, {
        fill: this.textFill,
        fontFamily: 'Helvetica',
        fontSize: 24,
    });

    textSprite.x = (this._width - textSprite.width) / 2;
    textSprite.y = (this._height - textSprite.height) / 2;

    this._sprite.addChild(textSprite);
};

Sprite_Button.prototype._onButtonDown = function() {
    this.parentObj.backgroundColour = 0x808080;
    this.parentObj.textFill = ['#FFFFFF'];
    this.parentObj.drawBackground();
    this.parentObj.drawText();
};

Sprite_Button.prototype._onButtonUp = function() {
    this.parentObj.callback.call(this);
};

Sprite_Button.prototype._onButtonOver = function() {
    this.parentObj.backgroundColour = 0xF0F0F0;
    this.parentObj.textFill = ['#000000'];
    this.parentObj.drawBackground();
    this.parentObj.drawText();
};

Sprite_Button.prototype._onButtonOut = function() {
    this.parentObj.backgroundColour = 0xFFFFFF;
    this.parentObj.textFill = ['#000000'];
    this.parentObj.drawBackground();
    this.parentObj.drawText();
};

//=============================================================================
// ** Sprite_Dialog
//=============================================================================

function Sprite_Dialog() {
    this.initialize.apply(this, arguments);
};

Object.defineProperties(Sprite_Dialog.prototype, {
    sprite: { get: function() { return this._sprite; } },
});

Sprite_Dialog.prototype.initialize = function(x, y, width, height) {
    this._createSprite(x, y, width, height);

    var back = Game.context.stage.children.length;
    Game.context.stage.addChildAt(this._sprite, back);
};

Sprite_Dialog.prototype._titleHeight = function() {
    return 32;
};

Sprite_Dialog.prototype._titleText = function() {
    return '';
};

Sprite_Dialog.prototype._createSprite = function(x, y, width, height) {
    this._sprite = new PIXI.Graphics();
    this._sprite.x = x;
    this._sprite.y = y;

    this._drawBackground(width, height);
    this._drawTitleBack(width);
    this._drawTitleText(width);
};

Sprite_Dialog.prototype._drawBackground = function(width, height) {
    this._sprite.beginFill(0xFFFFFF);
    this._sprite.drawRect(0, 0, width, height);
    this._sprite.endFill();
};

Sprite_Dialog.prototype._drawTitleBack = function(width) {
    this._sprite.beginFill(0x10A0C0);
    this._sprite.drawRect(0, 0, width, this._titleHeight());
    this._sprite.endFill();
};

Sprite_Dialog.prototype._drawTitleText = function(width) {
    var textSprite = new PIXI.Text(this._titleText(), {
        fill: ['#FFFFFF'],
        fontFamily: 'Helvetica',
        fontSize: 24,
    });

    textSprite.x = (width - textSprite.width) / 2;
    textSprite.y = (32 - textSprite.height) / 2;

    this._sprite.addChild(textSprite);
};

//=============================================================================
// ** Sprite_DialogPromotion
//=============================================================================

function Sprite_DialogPromotion() {
    this.initialize.apply(this, arguments);
}

Sprite_DialogPromotion.prototype = Object.create(Sprite_Dialog.prototype);
Sprite_DialogPromotion.prototype.constructor = Sprite_DialogPromotion;

Sprite_DialogPromotion.prototype.initialize = function(x, y, width, height, piece) {
    this._piece = piece;
    Sprite_Dialog.prototype.initialize.call(this, x, y, width, height);
};

Sprite_DialogPromotion.prototype._titleText = function() {
    return 'Promote?';
};

Sprite_DialogPromotion.prototype._createSprite = function(x, y, width, height) {
    Sprite_Dialog.prototype._createSprite.call(this, x, y, width, height);
    this._createButtons();
    this._drawPieces();
};

Sprite_DialogPromotion.prototype._createButtons = function() {
    var yesButton = new Sprite_Button(8, 112, 84, 40, 'Yes', this._yesCallback);    
    var noButton = new Sprite_Button(100, 112, 84, 40, 'No', this._noCallback);

    this._sprite.addChild(yesButton.sprite);
    this._sprite.addChild(noButton.sprite);
};

Sprite_DialogPromotion.prototype._drawPieces = function() {
    var baseTexture = PIXI.loader.resources[Sprite_Piece.FILEPATH].texture;
    var frameX = this._piece.id * 64;

    var promotedSprite = new PIXI.Sprite(new PIXI.Texture(baseTexture));
    promotedSprite.x = 18;
    promotedSprite.y = 44;
    promotedSprite.texture.frame = new PIXI.Rectangle(frameX, 64, 64, 64);

    var unpromotedSprite = new PIXI.Sprite(new PIXI.Texture(baseTexture));
    unpromotedSprite.x = 110;
    unpromotedSprite.y = 44;
    unpromotedSprite.texture.frame = new PIXI.Rectangle(frameX, 0, 64, 64);

    this._sprite.addChild(promotedSprite);
    this._sprite.addChild(unpromotedSprite);
};

Sprite_DialogPromotion.prototype._yesCallback = function() {
    Game.closePromotionDialog();
    Game.performAction(true);
};

Sprite_DialogPromotion.prototype._noCallback = function() {
    Game.closePromotionDialog();
    Game.performAction(false);
};