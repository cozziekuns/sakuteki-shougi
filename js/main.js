// 索敵将棋

//=============================================================================
// ** Shogi_Player
//=============================================================================

function Shogi_Player() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Shogi_Player.prototype, {
    alliance: { get: function() { return this._alliance; } },
    hand: { get: function() { return this._hand; } },
});

Shogi_Player.prototype.initialize = function(alliance) {
    this._alliance = alliance;
    this._hand = new Shogi_Hand(alliance);
};

Shogi_Player.prototype.capture = function(piece) {
    piece.demote();
    piece.setAlliance(this._alliance);

    this._hand.addPiece(piece);
};

Shogi_Player.prototype.friendlyPieces = function() {
    var pieces = [];

    for (var i = 0; i < Game.board.pieces.length; i++) {
        var candidatePiece = Game.board.pieces[i];
        if (candidatePiece.alliance == this._alliance) {
            pieces.push(candidatePiece);
        }
    }

    return pieces;
}

Shogi_Player.prototype.vision = function() {
    var vision = [];
    var friendlyPieces = this.friendlyPieces();

    for (var i = 0; i < friendlyPieces.length; i++) {
        vision = vision.concat(friendlyPieces[i].vision());
    }

    return vision;
};

//=============================================================================
// ** Shogi_Enemy
//=============================================================================

function Shogi_Enemy() {
    this.initialize.apply(this, arguments);
}

Shogi_Enemy.prototype.initialize = function() {
    
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
    this._createFog();
    this._createInteractiveEvents();
};

Shogi_Board.prototype.isFog = function(x, y) {
    return this._fog.isFog(x, y);
};

Shogi_Board.prototype.valid = function(x, y) {
    return (x >= 0 && x < 9 && y >=0 && y < 9);
};

Shogi_Board.prototype.pieceAt = function(x, y) {
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i].x == x && this.pieces[i].y == y) {
            return this.pieces[i];
        }
    }
    return false;
};

Shogi_Board.prototype.activePiece = function() {
    for (var i = 0; i < this.pieces.length; i++) {
        if (this.pieces[i].active) {
            return this.pieces[i];
        }
    }
    return null;
};

Shogi_Board.prototype.pushToFront = function(pieceSprite) {
    this.sprite.removeChild(pieceSprite);
    this.sprite.addChildAt(pieceSprite, this.sprite.children.length);
};

Shogi_Board.prototype.pushToBack = function(pieceSprite) {
    this.sprite.removeChild(pieceSprite);
    this.sprite.addChildAt(pieceSprite, 0);
};

Shogi_Board.prototype.placePiece = function(piece, x, y) {
    piece.moveTo(x, y);
    this.sprite.addChild(piece.sprite);
    this.pieces.push(piece);
};

Shogi_Board.prototype.placePieceStarting = function(piece, x, y) {
    var destX = Math.abs(8 * piece.alliance - x);
    var destY = Math.abs(8 * piece.alliance - y);

    this.placePiece(piece, destX, destY);
};

Shogi_Board.prototype.removePiece = function(piece) {
    piece.demote();
    this.sprite.removeChild(piece.sprite);
    this.pieces.splice(this.pieces.indexOf(piece), 1);
};

Shogi_Board.prototype.moveActivePiece = function(activePiece, candidatePiece, destX, destY) {
    if (this._destinationIsValid(activePiece, destX, destY)) {

        if (this.isFog(destX, destY)) {
            var xDiff = destX - activePiece.x
            var yDiff = destY - activePiece.y;
            if (xDiff != 0) {
                var xDir = xDiff / Math.abs(xDiff);
                for (var i = xDir; i < xDiff; i = i + xDir) {
                    if (this.pieceAt(activePiece.x + i, activePiece.y)) {
                        destX = activePiece.x - xDir + i; 
                    }
                }
            } else if (yDiff != 0) {
                var yDir = yDiff / Math.abs(yDiff);
                for (var i = yDir; Math.abs(i) < Math.abs(yDiff); i = i + yDir) {
                    if (this.pieceAt(activePiece.x, activePiece.y + i)) {
                        destY = activePiece.y - yDir + i;
                    }
                }
            }
            candidatePiece = null;
        }

        if (candidatePiece) {
            Game.currentPlayer.capture(candidatePiece);
            this.removePiece(candidatePiece);
        }

        activePiece.moveTo(destX, destY);
        activePiece.promoteIfPossible();

        this.updateFog();
        Game.endTurn();
    }

    activePiece.moveTo(activePiece.x, activePiece.y);
    activePiece.deactivate();
};

Shogi_Board.prototype.dropActivePiece = function(activePiece, candidatePiece, destX, destY) {
    activePiece.deactivate();
    if (candidatePiece) {
        Game.currentPlayer.capture(activePiece);
        this.removePiece(activePiece);
        if (this.isFog(destX, destY)) {
            Game.endTurn();
        }
    } else {
        activePiece.moveTo(destX, destY);

        this.updateFog();
        Game.endTurn();
    }
};

Shogi_Board.prototype._destinationIsValid = function(activePiece, destX, destY) {
    var range = activePiece.movementRange();
    for (var i = 0; i < range.length; i++) {
        if (destX == range[i][0] && destY == range[i][1]) {
            return true;
        }
    }

    return false;
};

Shogi_Board.prototype.updateFog = function() {
    this._fog.update();
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

Shogi_Board.prototype._createPieces = function() {
    for (var alliance = 0; alliance < 2; alliance++) {
        this._createPawns(alliance);
        this._createMinorPieces(alliance);
        this._createMajorPieces(alliance);
    }
};

Shogi_Board.prototype._createPawns = function(alliance) {
    for (var i = 0; i < 9; i++) {
        var piece = new Shogi_Piece(7, alliance);
        this.placePieceStarting(piece, i, 6);
    }
};

Shogi_Board.prototype._createMinorPieces = function(alliance) {
    for (var i = 6; i >= 3; i--) {
        var piece = new Shogi_Piece(i, alliance);
        var piece2 = new Shogi_Piece(i, alliance);

        this.placePieceStarting(piece, 6 - i, 8);
        this.placePieceStarting(piece2, 8 - (6 - i), 8);
    }
};

Shogi_Board.prototype._createMajorPieces = function(alliance) {
    var ou = new Shogi_Piece(0, alliance);
    var hissha = new Shogi_Piece(1, alliance);
    var kaku = new Shogi_Piece(2, alliance);
    
    this.placePieceStarting(ou, 4, 8);
    this.placePieceStarting(hissha, 7, 7);
    this.placePieceStarting(kaku, 1, 7);
};

Shogi_Board.prototype._createFog = function() {
    this._fog = new Shogi_Fog(this);
};

Shogi_Board.prototype._createInteractiveEvents = function() {
    this.sprite.interactive = true;
    this.sprite.on('pointerdown', this._onClick);
};

Shogi_Board.prototype._onClick = function(event) {
    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    var destX = Math.floor(coords['x'] / 64);
    var destY = Math.floor(coords['y'] / 64);

    var candidatePiece = Game.board.pieceAt(destX, destY);
    var activePiece = Game.board.activePiece();

    if (!Game.board.valid(destX, destY)) {
        if (activePiece && activePiece.x < 0 && activePiece.y < 0) {
            activePiece.deactivate();
            Game.currentPlayer.capture(activePiece);
            Game.board.removePiece(activePiece);
        }
        return;
    }

    if (activePiece) {
        if (activePiece.x >= 0 && activePiece.y >= 0) {
            Game.board.moveActivePiece(activePiece, candidatePiece, destX, destY);
        } else {
            Game.board.dropActivePiece(activePiece, candidatePiece, destX, destY);
        }
    } else if (candidatePiece) {
        if (candidatePiece.alliance != Game.currentPlayer.alliance) {
            return;
        }

        candidatePiece.activate();
        candidatePiece.x = coords['x'] - candidatePiece.sprite.width / 2;
        candidatePiece.y = coords['y'] - candidatePiece.sprite.height / 2;
    }
};

//=============================================================================
// ** Shogi_Fog
//=============================================================================

function Shogi_Fog() {
    this.initialize.apply(this, arguments);
}

Shogi_Fog.prototype.initialize = function(board) {
    this._board = board;
    this._createSprites();
};

Shogi_Fog.prototype.isFog = function(x, y) {
    return this._sprites[y][x].alpha > 0;
};

Shogi_Fog.prototype._createSprites = function() {
    this._sprites = []

    for (var j = 0; j < 9; j++) {
        this._sprites[j] = [];

        for (var i = 0; i < 9; i++) {
            var boardSprite = this._board.sprite;
            var sprite = new PIXI.Sprite.fromImage('img/fog.png');

            sprite.x = i * 64;
            sprite.y = j * 64;
            sprite.alpha = 0.5;
            this._sprites[j][i] = sprite;

            boardSprite.addChildAt(sprite, boardSprite.children.length);
        }
    }
};

Shogi_Fog.prototype.update = function() {
    for (var j = 0; j < 9; j++) {
        for (var i = 0; i < 9; i++) {
            this._sprites[j][i].alpha = 0.5;
        }
    }

    var vision = Game.player.vision();
    for (var i = 0; i < vision.length; i++) {
        this._sprites[vision[i][1]][vision[i][0]].alpha = 0;
    }
};

//=============================================================================
// ** Shogi_Hand
//=============================================================================

function Shogi_Hand() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Shogi_Hand.prototype, {
    alliance: { get: function() { return this._alliance; } },
});

Shogi_Hand.prototype.initialize = function(alliance) {
    this._alliance = alliance;
    this._pieces = {};
    this._createSprite();
    this._createInteractiveEvents();
};

Shogi_Hand.prototype.addPiece = function(piece) {
    if (!(piece.id in this._pieces)) {
        this._pieces[piece.id] = [];
    }

    this._putInPlace(piece);
    this.sprite.addChildAt(piece.sprite, 0);
    this._pieces[piece.id].push(piece);
};

Shogi_Hand.prototype.removePiece = function(piece) {
    this.sprite.removeChild(piece.sprite);

    var index = this._pieces[piece.id].indexOf(piece);
    this._pieces[piece.id].splice(index, 1);

    this._hoverPieceOverBoard(piece);
};

Shogi_Hand.prototype.pickUpPiece = function(pieceId) {
    var pieces = this._pieces[pieceId]
    if (!pieces || pieces.length == 0) {
        return;
    }

    pieces[pieces.length - 1].activate();
    this.removePiece(pieces[pieces.length - 1]);
};

Shogi_Hand.prototype._createSprite = function() {
    var offset = (Game.board.sprite.x - 304) / 2;

    this.sprite = new PIXI.Sprite.fromImage('img/hand.png');
    if (this._alliance == 0) {
        this.sprite.x = Game.WINDOW_WIDTH - offset - 304;
        this.sprite.y = Game.WINDOW_HEIGHT - offset - 304;
    } else {
        this.sprite.x = offset;
        this.sprite.y = offset;
    }

    this.sprite.parentObj = this;
    Game.context.stage.addChild(this.sprite);
};

Shogi_Hand.prototype._createInteractiveEvents = function() {
    this.sprite.interactive = true;
    this.sprite.on('pointerdown', this._onClick);
};

Shogi_Hand.prototype._putInPlace = function(piece) {
    var type_off_x = ((piece.id - 1) % 2) * 160;
    var piece_off_x = this._pieces[piece.id].length * 24;
    
    if (piece.id == 7) {
        piece_off_x /= 2;
    }

    piece.sprite.x = 12 + type_off_x + piece_off_x;
    piece.sprite.y = 12 + Math.floor((piece.id - 1) / 2) * 70;

    if (this._alliance == 1) {
        piece.sprite.x = 304 - piece.sprite.x - 64;
        piece.sprite.y = 304 - piece.sprite.y - 64;
    }
};

Shogi_Hand.prototype._hoverPieceOverBoard = function(piece) {
    var coords = Game.input().mouse.getLocalPosition(Game.board.sprite);
    
    Game.board.placePiece(piece, -1, -1);
    piece.sprite.x = coords['x'] - (piece.sprite.width / 2);
    piece.sprite.y = coords['y'] - (piece.sprite.height / 2);
};

Shogi_Hand.prototype._onClick = function() {
    if (this.parentObj.alliance != Game.currentPlayer.alliance) {
        return;
    }

    if (Game.board.activePiece()) {
        return;
    }

    var coords = Game.input().mouse.getLocalPosition(this);
    var x = (this.parentObj.alliance == 1 ? 304 - coords['x'] : coords['x']);
    var y = (this.parentObj.alliance == 1 ? 304 - coords['y'] : coords['y']);

    var pieceId = Math.floor((y - 12) / 70) * 2 + Math.floor((x - 12) / 160);
    pieceId = Math.min(pieceId, 6);

    var xBound = (pieceId % 2) * 160;
    var yBound = Math.floor(pieceId / 2) * 70;
    if (x >= xBound && x < xBound + 64 && y >= yBound && y < yBound + 64) {
        this.parentObj.pickUpPiece(pieceId + 1);
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
    alliance: { 
        get: function() { return this._alliance; },
        set: function(value) { this._alliance = value; }
    },
    x: { get: function() { return this._x; } },
    y: { get: function() { return this._y; } },
    active: { get: function() { return this._active; } },
});

Shogi_Piece.prototype.initialize = function(id, alliance) {
    this._id = id;
    this._alliance = alliance;
    this._x = 0;
    this._y = 0;
    this._active = false;
    this._promoted = false;
    this._createSprite();
    this._createInteractiveEvents();
};

Shogi_Piece.prototype.activate = function() {
    this._active = true;
    Game.board.pushToFront(this.sprite);
};
    
Shogi_Piece.prototype.deactivate = function() {
    this._active = false;
    Game.board.pushToBack(this.sprite);
};

Shogi_Piece.prototype.promote = function() {
    this._promoted = true;
    this._updateSpriteFrame();
};

Shogi_Piece.prototype.demote = function() {
    this._promoted = false;
    this._updateSpriteFrame();
};

Shogi_Piece.prototype.setAlliance = function(alliance) {
    this._alliance = alliance;
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

Shogi_Piece.prototype._forward = function() {
    return (this._alliance == 0 ? -1 : 1);
};

Shogi_Piece.prototype.movementRange = function() {
    var range = [];

    if (this._id == 0) {
        range = range.concat(this._movementRangeForOu());
    } else if (this._id == 1) {
        range = range.concat(this._movementRangeForHissha());
    } else if (this._id == 2) {
        range = range.concat(this._movementRangeForKaku());
    } else if (this._id == 3 || this._promoted) {
        range = range.concat(this._movementRangeForKin());
    } else if (this._id == 4) {
        range = range.concat(this._movementRangeForGin());
    } else if (this._id == 5) {
        range = range.concat(this._movementRangeForKeima());
    } else if (this._id == 6) {
        range = range.concat(this._movementRangeForKyo());
    } else if (this._id == 7) {
        range = range.concat(this._movementRangeForFu())
    }

    for (var i = range.length - 1; i >= 0; i--) {
        var occupyPiece = Game.board.pieceAt(range[i][0], range[i][1]);
        var blocked = (occupyPiece && occupyPiece.alliance == this._alliance);
        var valid = Game.board.valid(range[i][0], range[i][1]);

        if (blocked || !valid) {
            range.splice(i, 1);
        }
    }

    return range;
};

Shogi_Piece.prototype._movementRangeForOu = function() {
    var range = [];
    
    for (var j = -1; j <= 1; j++) {
        for (var i = -1; i <= 1; i++) {
            if (i == 0 && j == 0) {
                continue;
            }
            range.push([this._x + i, this._y + j]);
        }
    }

    return range;
};

Shogi_Piece.prototype._movementRangeForHissha = function() {
    var range = [];
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
    return range;
};

Shogi_Piece.prototype._movementRangeForKaku = function() {
    var range = [];
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
    return range;
};

Shogi_Piece.prototype._movementRangeForKin = function() {
    var range = [];
    range.push([this._x - 1, this._y + this._forward()]);
    range.push([this._x, this._y + this._forward()]);
    range.push([this._x + 1, this._y + this._forward()]);
    range.push([this._x - 1, this._y]);
    range.push([this._x + 1, this._y]);
    range.push([this._x, this._y - this._forward()]);
    return range;
};

Shogi_Piece.prototype._movementRangeForGin = function() {
    var range = [];
    range.push([this._x - 1, this._y + this._forward()]);
    range.push([this._x, this._y + this._forward()]);
    range.push([this._x + 1, this._y + this._forward()]);
    range.push([this._x - 1, this._y - this._forward()]);
    range.push([this._x + 1, this._y - this._forward()]);
    return range;
};

Shogi_Piece.prototype._movementRangeForKeima = function() {
    var range = [];
    range.push([this._x - 1, this._y + this._forward() * 2]);
    range.push([this._x + 1, this._y + this._forward() * 2]);
    return range;
};

Shogi_Piece.prototype._movementRangeForFu = function() {
    var range = [[this._x, this._y + this._forward()]];
    return range;
};

Shogi_Piece.prototype._movementRangeForKyo = function() {
    var range = [];
    range = range.concat(
        this.rangeInDirection(this._x, this._y, 0, this._forward())
    );
    return range;
};

Shogi_Piece.prototype.rangeInDirection = function(sx, sy, x_dir, y_dir) {
    return this._nodesInDirection(sx, sy, x_dir, y_dir, false);
};

Shogi_Piece.prototype.vision = function() {
    var vision = [[this._x, this._y]];

    if (this._id == 0) {
        vision = vision.concat(this._visionDiamond(3));
    } else if (this._id == 1) {
        if (this._promoted) {
            vision = vision.concat(this._visionDiamond(4));
        } else {
            vision = vision.concat(this._visionDiamond(3));
        }
    } else if (this._id == 2) {
        vision = vision.concat(this.visionInDirection(this._x, this._y, -1, -1));
        vision = vision.concat(this.visionInDirection(this._x, this._y, -1, 1));
        vision = vision.concat(this.visionInDirection(this._x, this._y, 1, -1));
        vision = vision.concat(this.visionInDirection(this._x, this._y, 1, 1));
        if (this._promoted) {
            vision = vision.concat(this._visionDiamond(1));
        }
    } else if (this._id == 3 || this._promoted) {
        vision = vision.concat(this._visionDiamond(2));
    } else if (this._id == 4) {
        vision = vision.concat(this._visionDiamond(2));
    } else if (this._id == 5) {
        vision = vision.concat(this._visionDiamond(3));
    } else if (this._id == 6) {
        vision = vision.concat(
            this.visionInDirection(this._x, this._y, 0, this._forward())
        );
    } else if (this._id == 7) {
        vision.push([this._x - 1, this._y + this._forward()]);
        vision.push([this._x, this._y + this._forward()]);
        vision.push([this._x + 1, this._y + this._forward()]);
        vision.push([this._x, this._y + this._forward() * 2]);
    }

    for (var i = vision.length - 1; i >= 0; i--) {
        if (!Game.board.valid(vision[i][0], vision[i][1])) {
            vision.splice(i, 1);
        }
    }

    return vision;
};

Shogi_Piece.prototype.visionInDirection = function(sx, sy, x_dir, y_dir) {
    return this._nodesInDirection(sx, sy, x_dir, y_dir, true);
};

Shogi_Piece.prototype._visionDiamond = function(radius) {
    var vision = []

    for (var j = -radius; j <= radius; j++) {
        for (var i = -radius; i <= radius; i++) {
            if (i == 0 && j == 0 || Math.abs(i) + Math.abs(j) > radius) {
                continue;
            }
            vision.push([this._x + i, this._y + j]);
        }
    }

    return vision;
};

Shogi_Piece.prototype._nodesInDirection = function(sx, sy, x_dir, y_dir, vision) {
    var range = [];

    var i = x_dir;
    var j = y_dir;
    
    while (true) {
        if (!Game.board.valid(sx + i, sy + j)) {
            break;
        }
        range.push([sx + i, sy + j]);
        if (Game.board.pieceAt(sx + i, sy + j)) {
            if (vision || !Game.board.isFog(sx + i, sy + j)) {
                break;
            }   
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

Game.WINDOW_WIDTH = 1280;
Game.WINDOW_HEIGHT = 720;

Game.preloadAllAssets = function() {
    PIXI.loader
        .add('img/pieces.png')
        .load(Game.run);
};

Game.run = function() {
    Game.createContext();
    Game.createBoard();
    Game.createPlayers();
    Game.board.updateFog();
    Game.placeBoardOnTop();
};

Game.input = function() {
    return Game.context.renderer.plugins.interaction;
};

Game.endTurn = function() {
    if (this.player == this.currentPlayer) {
        this.currentPlayer = this.enemy;
    } else {
        this.currentPlayer = this.player;
    }
};

Game.createContext = function() {
    this.context = new PIXI.Application(
        Game.WINDOW_WIDTH,
        Game.WINDOW_HEIGHT, 
        {backgroundColor: 0x1099bb},
    );

    document.body.appendChild(this.context.view);
};

Game.createPlayers = function() {
    this.player = new Shogi_Player(0);
    this.enemy = new Shogi_Player(1);
    this.currentPlayer = this.player;
};

Game.createBoard = function() {
    this.board = new Shogi_Board();
};

Game.placeBoardOnTop = function() {
    var stage =  Game.context.stage;
    stage.addChildAt(this.board.sprite, stage.children.length);
};

//=============================================================================
// ** Main
//=============================================================================

window.onload = function() {
    Game.preloadAllAssets();
};