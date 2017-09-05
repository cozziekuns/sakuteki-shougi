// 索敵将棋

//=============================================================================
// ** Shogi_Player
//=============================================================================

function Shogi_Player() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Shogi_Player.prototype, {
    alliance: { get: function() { return this._alliance; } },
});

Shogi_Player.prototype.initialize = function(alliance) {
    this._alliance = alliance;
};

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

// TODO: Add functionality for pieces in hand
Shogi_Board.prototype.flipBoard = function() {
    if (this.getActivePiece() !== null) {
        return;
    }

    for (var i = 0; i < this.pieces.length; i++) {
        this.pieces[i].moveTo(8 - this.pieces[i].x, 8 - this.pieces[i].y);
    }
};

Shogi_Board.prototype.pieceAt = function(x, y) {
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i].x == x && this.pieces[i].y == y) {
            return this.pieces[i];
        }
    }
    return false;
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

Shogi_Board.prototype.pushToFront = function(pieceSprite) {
    this.sprite.removeChild(pieceSprite);
    this.sprite.addChildAt(pieceSprite, this.sprite.children.length);
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
    for (var alliance = 0; alliance < 2; alliance++) {
        this._createPawns(alliance);
        this._createMinorPieces(alliance);
        this._createMajorPieces(alliance);
    }
};

Shogi_Board.prototype._placePiece = function(piece, x, y) {
    var dest_x = Math.abs(8 * piece.alliance - x);
    var dest_y = Math.abs(8 * piece.alliance - y);

    piece.moveTo(dest_x, dest_y);

    this.sprite.addChild(piece.sprite);
    this.pieces.push(piece);
};

Shogi_Board.prototype._createPawns = function(alliance) {
    for (var i = 0; i < 9; i++) {
        var piece = new Shogi_Piece(7, alliance);
        this._placePiece(piece, i, 6);
    }
};

Shogi_Board.prototype._createMinorPieces = function(alliance) {
    for (var i = 6; i >= 3; i--) {
        var piece = new Shogi_Piece(i, alliance);
        var piece2 = new Shogi_Piece(i, alliance);

        this._placePiece(piece, 6 - i, 8);
        this._placePiece(piece2, 8 - (6 - i), 8);
    }
};

Shogi_Board.prototype._createMajorPieces = function(alliance) {
    var ou = new Shogi_Piece(0, alliance);
    var hissha = new Shogi_Piece(1, alliance);
    var kaku = new Shogi_Piece(2, alliance);
    
    this._placePiece(ou, 4, 8);
    this._placePiece(hissha, 7, 7);
    this._placePiece(kaku, 1, 7);
};

Shogi_Board.prototype._onClick = function(event) {
    activePiece = Game.board.getActivePiece();
    if (activePiece === null) {
        return;
    }

    var range = activePiece.movementRange();
    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    var dest_x = Math.floor(coords['x'] / 64)
    var dest_y = Math.floor(coords['y'] / 64)

    if (activePiece.x == dest_x && activePiece.y == dest_y) {
        return;
    }

    // Check if the piece can actually move there
    for (var i = 0; i < range.length; i++) {
        if (dest_x == range[i][0] && dest_y == range[i][1]) {
            activePiece.moveTo(dest_x, dest_y);
        }
    }

    activePiece.moveTo(activePiece.x, activePiece.y);
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
    alliance: { get: function() { return this._alliance; } },
});

Shogi_Piece.prototype.initialize = function(id, alliance) {
    this._id = id;
    this._alliance = alliance
    this._x = 0;
    this._y = 0;
    this._active = false;
    this._createSprite();
    this._createInteractiveEvents();
    this._updateSprite();
};

Shogi_Piece.prototype.activate = function() {
    this._active = true;
    Game.board.pushToFront(this.sprite);
};
    
Shogi_Piece.prototype.deactivate = function() {
    this._active = false;
};

Shogi_Piece.prototype.forward = function() {
    return (this._alliance == 0 ? -1 : 1);
};

Shogi_Piece.prototype.movementRange = function() {
    var range = [];
    // Get the general movement range
    if (this._id == 7) {
        range.push([this._x, this._y + this.forward()]);
    }

    // Remove any squares that are inhabited by friendly units
    for (var i = range.length - 1; i >= 0; i--) {
        var occupyPiece = Game.board.pieceAt(range[i][0], range[i][1]);
        if (occupyPiece && occupyPiece.alliance == this._alliance) {
            range.splice(i, i);
        }
    }

    return range;
};

Shogi_Piece.prototype._createSprite = function() {
    var baseTexture = PIXI.loader.resources['img/pieces.png'].texture;
    var texture = new PIXI.Texture(baseTexture);

    var frameX = this._id * 64
    var frameY = this._alliance * 128;

    this.sprite = new PIXI.Sprite(texture);
    this.sprite.texture.frame = new PIXI.Rectangle(frameX, frameY, 64, 64);
    this.sprite.parentObj = this;
};

Shogi_Piece.prototype._createInteractiveEvents = function() {
    this.sprite.interactive = true;
    this.sprite.on('pointerdown', this._onClick);
    this.sprite.on('mousemove', this._onMouseMove);
};

Shogi_Piece.prototype.moveTo = function(x, y) {
    this._x = x;
    this._y = y;
    this.sprite.x = this._x * 64;
    this.sprite.y = this._y * 64;
};

Shogi_Piece.prototype._updateSprite = function() {
    this.sprite.x = this._x * 64;
    this.sprite.y = this._y * 64;
};

Shogi_Piece.prototype._onClick = function() {
    this.parentObj.activate();
    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    this.x = coords['x'] - (this.width / 2);
    this.y = coords['y'] - (this.height / 2);
};

Shogi_Piece.prototype._onMouseMove = function() {
    if (!this.parentObj.active) {
        return;
    }
    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    this.x = coords['x'] - (this.width / 2);
    this.y = coords['y'] - (this.height / 2);
};

//=============================================================================
// ** Game
//=============================================================================

function Game() {
    throw new Error('This is a static class.')
}

Game.WINDOW_WIDTH = 800;
Game.WINDOW_HEIGHT = 600;

Game.preloadAllAssets = function() {
    PIXI.loader
        .add('img/pieces.png')
        .load(Game.run);
};

Game.run = function() {
    Game.createContext();
    Game.createBoard();
    // this.context.ticker.add(this.update);
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

//=============================================================================
// ** Main
//=============================================================================

window.onload = function() {
    Game.preloadAllAssets();
};