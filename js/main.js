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
    this._createInteractiveEvents();
};

Shogi_Board.prototype.valid = function(x, y) {
    return (x >= 0 && x < 9 && y >=0 && y < 9);
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
    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    var dest_x = Math.floor(coords['x'] / 64);
    var dest_y = Math.floor(coords['y'] / 64);

    var candidatePiece = Game.board.pieceAt(dest_x, dest_y);
    var activePiece = Game.board.getActivePiece();

    if (activePiece === null) {
        if (candidatePiece) {
            candidatePiece.activate();
            candidatePiece.x = coords['x'] - candidatePiece.sprite.width / 2;
            candidatePiece.y = coords['y'] - candidatePiece.sprite.height / 2;
        }
    } else {
        var range = activePiece.movementRange();

        for (var i = 0; i < range.length; i++) {
            if (dest_x == range[i][0] && dest_y == range[i][1]) {
                if (candidatePiece) {
                    candidatePiece.removeFromBoard();
                }
                activePiece.moveTo(dest_x, dest_y);
                activePiece.promoteIfPossible();
            }
        }
    
        activePiece.moveTo(activePiece.x, activePiece.y);
        activePiece.deactivate();
    }
};

//=============================================================================
// ** Shogi_Piece
//=============================================================================

function Shogi_Piece() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Shogi_Piece.prototype, {
    id: { get: function() { return this._id; } },
    alliance: { get: function() { return this._alliance; } },
    x: { get: function() { return this._x; } },
    y: { get: function() { return this._y; } },
    active: { get: function() { return this._active; } },
    inHand: { get: function() { return this._inHand; } },
});

Shogi_Piece.prototype.initialize = function(id, alliance) {
    this._id = id;
    this._alliance = alliance;
    this._x = 0;
    this._y = 0;
    this._active = false;
    this._promoted = false;
    this._inHand = false;
    this._createSprite();
    this._createInteractiveEvents();
};

Shogi_Piece.prototype.activate = function() {
    this._active = true;
    Game.board.pushToFront(this.sprite);
};
    
Shogi_Piece.prototype.deactivate = function() {
    this._active = false;
};

Shogi_Piece.prototype.promote = function() {
    this._promoted = true;
    this._updateSpriteFrame();
};

Shogi_Piece.prototype.demote = function() {
    this._promoted = false;
    this._updateSpriteFrame();
};

Shogi_Piece.prototype.promoteIfPossible = function() {
    var pieceCanPromote = [1, 2, 4, 5, 6, 7].includes(this._id);
    var insidePromotionZone = (
        this._alliance == 0 && this._y <= 2 || 
        this._alliance == 1 && this._y >= 6
    );

    if (pieceCanPromote && insidePromotionZone) {
        this.promote();
    }
};

Shogi_Piece.prototype.removeFromBoard = function() {
    this._x = -1;
    this._y = -1;
    this._inHand = true;
    this._alliance = (this._alliance + 1) % 2;
    // TODO: Move the sprite into the hand of a player
    this.sprite.x = -160;
    this.sprite.y = -160;
    this.demote();
};

Shogi_Piece.prototype._forward = function() {
    return (this._alliance == 0 ? -1 : 1);
};

Shogi_Piece.prototype.movementRange = function() {
    var range = [];

    if (this._id == 0) {
        for (var j = -1; j <= 1; j++) {
            for (var i = -1; i <= 1; i++) {
                if (i == 0 && j == 0) {
                    continue;
                }
                range.push([this._x + i, this._y + j]);
            }
        }
    } else if (this._id == 1) {
        range = range.concat(this.rangeInDirection(this._x, this._y, 0, -1));
        range = range.concat(this.rangeInDirection(this._x, this._y, -1, 0));
        range = range.concat(this.rangeInDirection(this._x, this._y, 1, 0));
        range = range.concat(this.rangeInDirection(this._x, this._y, 0, 1));
        if (this._promoted) {
            range.push([this._x - 1, this._y - 1]);
            range.push([this._x - 1, this._y + 1]);
            range.push([this._x + 1, this._y - 1]);
            range.push([this._x + 1, this._y + 1]);
        }
    } else if (this._id == 2) {
        range = range.concat(this.rangeInDirection(this._x, this._y, -1, -1));
        range = range.concat(this.rangeInDirection(this._x, this._y, -1, 1));
        range = range.concat(this.rangeInDirection(this._x, this._y, 1, -1));
        range = range.concat(this.rangeInDirection(this._x, this._y, 1, 1));
        if (this._promoted) {
            range.push([this._x + 1, this._y]);
            range.push([this._x - 1, this._y]);
            range.push([this._x, this._y - 1]);
            range.push([this._x, this._y + 1]);
        }
    } else if (this._id == 3 || this._promoted) {
        range.push([this._x - 1, this._y + this._forward()]);
        range.push([this._x, this._y + this._forward()]);
        range.push([this._x + 1, this._y + this._forward()]);
        range.push([this._x - 1, this._y]);
        range.push([this._x + 1, this._y]);
        range.push([this._x, this._y - this._forward()]);
    } else if (this._id == 4) {
        range.push([this._x - 1, this._y + this._forward()]);
        range.push([this._x, this._y + this._forward()]);
        range.push([this._x + 1, this._y + this._forward()]);
        range.push([this._x - 1, this._y - this._forward()]);
        range.push([this._x + 1, this._y - this._forward()]);
    } else if (this._id == 5) {
        range.push([this._x - 1, this._y + this._forward() * 2]);
        range.push([this._x + 1, this._y + this._forward() * 2]);
    } else if (this._id == 6) {
        range = range.concat(
            this.rangeInDirection(this._x, this._y, 0, this._forward())
        );
    } else if (this._id == 7) {
        range.push([this._x, this._y + this._forward()]);
    }

    for (var i = range.length - 1; i >= 0; i--) {
        var occupyPiece = Game.board.pieceAt(range[i][0], range[i][1]);
        if (occupyPiece && occupyPiece.alliance == this._alliance) {
            range.splice(i, 1);
        }
    }

    return range;
};

Shogi_Piece.prototype.rangeInDirection = function(sx, sy, x_dir, y_dir) {
    var range = [];

    var i = x_dir;
    var j = y_dir;
    
    while (true) {
        if (!Game.board.valid(sx + i, sy + j)) {
            break;
        }
        range.push([sx + i, sy + j]);
        if (Game.board.pieceAt(sx + i, sy + j)) {
            break;
        }
        
        i += x_dir;
        j += y_dir;
    }

    return range;
};

Shogi_Piece.prototype._createSprite = function() {
    var baseTexture = PIXI.loader.resources['img/pieces.png'].texture;
    var texture = new PIXI.Texture(baseTexture);
    this.sprite = new PIXI.Sprite(texture);
    this._updateSpriteFrame();
};

Shogi_Piece.prototype._createInteractiveEvents = function() {
    this.sprite.interactive = true;
    this.sprite.on('mousemove', this._onMouseMove);
};

Shogi_Piece.prototype.moveTo = function(x, y) {
    this._x = x;
    this._y = y;
    this.sprite.x = this._x * 64;
    this.sprite.y = this._y * 64;
};

Shogi_Piece.prototype._updateSpriteFrame = function() {
    var frameX = this._id * 64;
    var frameY = this._alliance * 128 + (this._promoted ? 64 : 0);

    this.sprite.texture.frame = new PIXI.Rectangle(frameX, frameY, 64, 64);
    this.sprite.parentObj = this;
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
    throw new Error('This is a static class.');
}

Game.WINDOW_WIDTH = 1024;
Game.WINDOW_HEIGHT = 768;

Game.preloadAllAssets = function() {
    PIXI.loader
        .add('img/pieces.png')
        .load(Game.run);
};

Game.run = function() {
    Game.createContext();
    Game.createBoard();
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