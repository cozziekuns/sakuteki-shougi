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
    Game.createContext();
    Game.createBoard();
    Game.createPieces();
};

Game.createContext = function() {
    this.context = new PIXI.Application(
        this.WINDOW_WIDTH,
        this.WINDOW_HEIGHT, 
        {backgroundColor: 0x1099bb},
    );

    document.body.appendChild(this.context.view);
};

Game.createBoard = function() {
    this._boardSprite = new Sprite_Board();
    this._boardSprite.x = (Game.WINDOW_WIDTH - 576) / 2;
    this._boardSprite.y = (Game.WINDOW_HEIGHT - 576) / 2;
};

Game.createPieces = function() {
    this._pieceSprites = [];
    for (var i = 0; i < BattleManager.board.pieces.length; i++) {
        var sprite = new Sprite_Piece(BattleManager.board.pieces[i]);
        this._pieceSprites.push(sprite);
    }
};

//=============================================================================
// ** Main
//=============================================================================

window.onload = function() {
    Game.preloadAllAssets();
};