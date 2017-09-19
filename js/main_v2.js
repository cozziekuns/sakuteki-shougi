//=============================================================================
// ** Game
//=============================================================================

function Game() {
    throw new Error('This is a static class.');
}

Game.WINDOW_WIDTH = 1280;
Game.WINDOW_HEIGHT = 720;

Game.preloadAllAssets = function() {
    PIXI.loader
        .add('img/pieces.png')
        .load(Game.run);
};

Game.run = function() {
    BattleManager.init();
    Game._createContext();
    Game._createBoard();
    Game._createPieces();
    Game._createCountSprites();
};

Game.pushToFront = function(sprite) {
    this.context.stage.removeChild(sprite);
    this.context.stage.addChildAt(sprite, this.context.stage.children.length);
};

Game.closePromotionDialog = function() {
    this.context.stage.removeChild(this._backgroundSprite);
    this.context.stage.removeChild(this._dialogSprite.sprite);
};

Game.processEvent = function(actionList, checkForPromote) {
    if (actionList.isValid()) {
        this._actionList = actionList;
        if (checkForPromote) {
            Game._promptForPromotion(actionList.piece);
            return;
        }
        Game.performAction(false);
    }

    Game.alignAllSprites();
};

Game.performAction = function(withPromote) {
    if (withPromote) {
        var action = new Game_Action(this._actionList.piece, 'promote');
        this._actionList.addAction(action);
    }

    BattleManager.queueAction(this._actionList);
    BattleManager.performNextAction();
    Game.alignAllSprites();
};

Game.alignAllSprites = function() {
    for (var i = 0; i < this._pieceSprites.length; i++) {
        this._pieceSprites[i].alignToObject();
    }
    this._leftCountSprite.refresh();
    this._rightCountSprite.refresh();
};

Game._promptForPromotion = function(piece) {
    this._createBackgroundSprite();
    this._createPromotionDialog(piece);
};

Game._createContext = function() {
    this.context = new PIXI.Application(
        this.WINDOW_WIDTH,
        this.WINDOW_HEIGHT, 
        {backgroundColor: 0x10A0C0},
    );

    document.body.appendChild(this.context.view);
};

Game._createBoard = function() {
    this._boardSprite = new PIXI.Sprite.fromImage('img/board.png');
    this._boardSprite.x = (Game.WINDOW_WIDTH - 576) / 2;
    this._boardSprite.y = (Game.WINDOW_HEIGHT - 576) / 2;
    this.context.stage.addChild(this._boardSprite);
};

Game._createPieces = function() {
    this._pieceSprites = [];
    for (var i = 0; i < BattleManager.board.pieces.length; i++) {
        var sprite = new Sprite_Piece(BattleManager.board.pieces[i]);
        this._pieceSprites.push(sprite);
    }
};

Game._createCountSprites = function() {
    this._leftCountSprite = new Sprite_PieceCount(0);
    this._rightCountSprite = new Sprite_PieceCount(1);
};

Game._createBackgroundSprite = function() {
    this._backgroundSprite = new PIXI.Graphics();
    this._backgroundSprite.interactive = true;
    this._backgroundSprite.alpha = 0.75;

    this._backgroundSprite.beginFill(0xA0A0A0);
    this._backgroundSprite.drawRect(0, 0, this.WINDOW_WIDTH, this.WINDOW_HEIGHT);
    this._backgroundSprite.endFill();

    var back = this.context.stage.children.length;
    this.context.stage.addChildAt(this._backgroundSprite, back);
};

Game._createPromotionDialog = function(piece) {
    var x = (Game.WINDOW_WIDTH - 192) / 2;
    var y = (Game.WINDOW_HEIGHT - 160) / 2

    this._dialogSprite = new Sprite_DialogPromotion(x, y, 192, 160, piece);
};

//=============================================================================
// ** Main
//=============================================================================

window.onload = function() {
    Game.preloadAllAssets();
};