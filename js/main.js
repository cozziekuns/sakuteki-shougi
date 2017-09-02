// 索敵将棋

//=============================================================================
// ** Shogi_Board
//=============================================================================

function Shogi_Board() {
    this.initialize.apply(this, arguments);
}

Shogi_Board.prototype.initialize = function() {
    this._createBoard();
    this._createSprite();
    this._createPieces();
};

Shogi_Board.prototype.getActivePiece = function() {
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i].active) {
            return this.pieces[i];
        }
    }
    return null;
};

Shogi_Board.prototype.deactivatePieces = function() {
    for (var i = 0; i < this.pieces.length; i++) {
        this.pieces[i].deactivate();
    }
};

Shogi_Board.prototype._createBoard = function() {
    this.pieces = [];
};

Shogi_Board.prototype._createSprite = function() {
    this.sprite = new PIXI.Sprite.fromImage('img/board.png');
    this.sprite.x = (Game.WINDOW_WIDTH - 576) / 2;
    this.sprite.y = (Game.WINDOW_HEIGHT - 576) / 2;

    Game.context.stage.addChild(this.sprite);
    this._createInteractiveEvents();
};

Shogi_Board.prototype._createInteractiveEvents = function() {
    this.sprite.interactive = true;
    this.sprite.on('pointerdown', this._onClick);
};

Shogi_Board.prototype._createPieces = function() {
    var piece = new Shogi_Piece(0, 4, 4);
    this.sprite.addChild(piece.sprite);
    this.pieces.push(piece);
};

Shogi_Board.prototype.update = function() {
    this.updatePieces();
};

Shogi_Board.prototype.updatePieces = function() {
    for (var i = 0; i < this.pieces.length; i++) {
        this.pieces[i].update();
    }
    console.log();
};

Shogi_Board.prototype._onClick = function(event) {
    activePiece = Game.board.getActivePiece();
    if (activePiece === null) {
        return;
    }

    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    var dest_x = Math.floor(coords['x'] / 64)
    var dest_y = Math.floor(coords['y'] / 64)

    // Check if the piece can actually move there
    if (dest_x == activePiece.x && dest_y == activePiece.y) {
        return;
    }

    activePiece.moveTo(dest_x, dest_y);
    activePiece.deactivate();
};

//=============================================================================
// ** Shogi_Piece
//=============================================================================

function Shogi_Piece() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Shogi_Piece.prototype, {
    id: { get: function() { return this._id; } },
    x: { get: function() { return this._x; } },
    y: { get: function() { return this._y; } },
    active: { get: function() { return this._active; } },
});

Shogi_Piece.prototype.initialize = function(id, x, y) {
    this._id = id;
    this._x = x;
    this._y = y;
    this._active = false;
    this._createSprite();
    this._createInteractiveEvents();
    this.update();
};

Shogi_Piece.prototype.screenX = function() {
    return this._x * 64;
};

Shogi_Piece.prototype.screenY = function() {
    return this._y * 64;
};

Shogi_Piece.prototype._onClick = function() {
    this.parentObj.activate();
};

Shogi_Piece.prototype.activate = function() {
    this._active = true;
};
    
Shogi_Piece.prototype.deactivate = function() {
    this._active = false;
};

Shogi_Piece.prototype._createSprite = function() {
    // Cache this eventually
    var texture = new PIXI.Texture.fromImage('img/pieces.png');
    texture.frame = new PIXI.Rectangle(this._id, 0, 64, 64);

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.parentObj = this;
};

Shogi_Piece.prototype._createInteractiveEvents = function() {
    this.sprite.interactive = true;
    this.sprite.on('pointerdown', this._onClick);
};

Shogi_Piece.prototype.moveTo = function(x, y) {
    this._x = x;
    this._y = y;
};

Shogi_Piece.prototype.update = function() {
    this._updateInput();
    this._updateSprite();
};

Shogi_Piece.prototype._updateInput = function() {
    
};

Shogi_Piece.prototype._updateSprite = function() {
    this.sprite.x = this._x * 64;
    this.sprite.y = this._y * 64;
};

//=============================================================================
// ** Game
//=============================================================================

function Game() {
    throw new Error('This is a static class.')
}

Game.WINDOW_WIDTH = 800;
Game.WINDOW_HEIGHT = 600;

Game.run = function() {
    Game.createContext();
    Game.createBoard();
    this.context.ticker.add(this.update);
};

Game.input = function() {
    return Game.context.renderer.plugins.interaction;
};

Game.createContext = function() {
    this.context = new PIXI.Application(
        Game.WINDOW_WIDTH,
        Game.WINDOW_HEIGHT, 
        {backgroundColor: 0x1099bb}
    );

    document.body.appendChild(this.context.view);
};

Game.createBoard = function() {
    this.board = new Shogi_Board();  
};

Game.update = function(delta) {
    Game.board.update();    
};

//=============================================================================
// ** Main
//=============================================================================

window.onload = function() {
    Game.run();
};