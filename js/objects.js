//=============================================================================
// ** Game_Action
//=============================================================================

function Game_Action() {
    this.initialize.apply(this, arguments);
}

Game_Action.prototype.initialize = function(piece, action, destX, destY) {
    this._piece = piece;
    this._action = action;
    this._lastX = piece.x;
    this._lastY = piece.y;

    if (destX && destY) {
        this._destX = destX;
        this._destY = destY;
    }
};

Game_Action.prototype.execute = function() {
    switch (this._action) {
        case 'move', 'drop':
            piece.moveTo(this._destX, this._destY);
        case 'capture':
            piece.capture();
        case 'promote':
            piece.promote();
        case 'demote':
            piece.demote();
    }
};

Game_Action.prototype.undo = function() {
    switch (this._action) {
        case 'move':
            piece.moveTo(this._lastX, this._lastY);
        case 'drop':
            piece.moveTo(-1, -1);
        case 'capture':
            piece.decapture(this._lastX, this._lastY);
        case 'promote':
            piece.demote();
        case 'demote':
            piece.promote();
    }
};

//=============================================================================
// ** Game_Board
//=============================================================================

function Game_Board() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Game_Board.prototype, {
    pieces: { get: function() { return this._pieces; } },
});

Game_Board.prototype.initialize = function() {
    this._createPieces();
};

Game_Board.prototype.pieceAt = function(x, y) {
    for (var i = 0; i < this._pieces.length; i++) {
        var piece = this._pieces[i];
        if (piece.x == x && piece.y == y) {
            return piece;
        }
    }
    return null;
};

Game_Board.prototype._createPieces = function() {
    this._pieces = [];
    for (var alliance = 0; alliance < 2; alliance++) {
        this._createPawns(alliance);
        this._createMinorPieces(alliance);
        this._createMajorPieces(alliance);
    }
};

Game_Board.prototype._createPawns = function(alliance) {
    for (var i = 0; i < 9; i++) {
        var pawn = new Game_Piece(7, alliance);
        this._placePieceStarting(pawn, i, 6);
    }
};

Game_Board.prototype._createMinorPieces = function(alliance) {
    for (var i = 6; i >= 3; i--) {
        var piece = new Game_Piece(i, alliance);
        var piece2 = new Game_Piece(i, alliance);

        this._placePieceStarting(piece, 6 - i, 8);
        this._placePieceStarting(piece2, 8 - (6 - i), 8);
    }
};

Game_Board.prototype._createMajorPieces = function(alliance) {
    var ou = new Game_Piece(0, alliance);
    var hissha = new Game_Piece(1, alliance);
    var kaku = new Game_Piece(2, alliance);

    this._placePieceStarting(ou, 4, 8);
    this._placePieceStarting(hissha, 7, 7);
    this._placePieceStarting(kaku, 1, 7);
};

Game_Board.prototype._placePieceStarting = function(piece, x, y) {
    var destX = Math.abs(8 * piece.alliance - x);
    var destY = Math.abs(8 * piece.alliance - y);

    piece.moveTo(destX, destY);
    this._pieces.push(piece);
};

//=============================================================================
// ** Game_Piece
//=============================================================================

function Game_Piece() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Game_Piece.prototype, {
    id: { get: function() { return this._id; } },
    x: { get: function() { return this._x; } },
    y: { get: function() { return this._y; } },
    alliance: { get: function() { return this._alliance; } },
    promoted: { get: function() { return this._promoted; } },
});

Game_Piece.prototype.initialize = function(id, alliance) {
    this._id = id;
    this._alliance = alliance
    this._x = 0;
    this._y = 0;
};

Game_Piece.prototype.screenX = function() {
    if (this._x < 0) {

    } else {
        return this._x * 64 + (Game.WINDOW_WIDTH - 576) / 2;
    }
};

Game_Piece.prototype.screenY = function() {
    if (this._y < 0) {

    } else {
        return this._y * 64 + (Game.WINDOW_HEIGHT - 576) / 2;
    }
}

Game_Piece.prototype.moveTo = function(x, y) {
    this._x = x;
    this._y = y;
};

Game_Piece.prototype.capture = function() {
    this.moveTo(-1, -1);
    this._switchAlliance();
};

Game_Piece.prototype.decapture = function(x, y) {
    this.moveTo(x, y);
    this._switchAlliance();
};

Game_Piece.prototype.promote = function() {
    this._promoted = true;
};

Game_Piece.prototype.demote = function() {
    this._promoted = false;
};

Game_Piece.prototype.getMovementRange = function() {
    if (this._id == 0) {
        var range = this._movementRangeForOu();
    } else if (this._id == 1) {
        var range = this._movementRangeForHissha();
    } else if (this._id == 2) {
        var range = this._movementRangeForKaku();
    } else if (this._id == 3 || this._promoted) {
        var range = this._movementRangeForKin();
    } else if (this._id == 4) {
        var range = this._movementRangeForGin();
    } else if (this._id == 5) {
        var range = this._movementRangeForKeima();
    } else if (this._id == 6) {
        var range = this._movementRangeForKyo();
    } else if (this._id == 7) {
        var range = this._movementRangeForFu();
    }

    for (var i = range.length - 1; i >= 0; i--) {
        var occupyPiece = BattleManager.board.pieceAt(range[i][0], range[i][1]);
        var blocked = (occupyPiece && occupyPiece.alliance == this._alliance);
        var valid = BattleManager.board.isValid(range[i][0], range[i][1]);

        if (blocked || !valid) {
            range.splice(i, 1);
        }
    }

    return range;
};

Game_Piece.prototype._switchAlliance = function() {
    this._alliance = (this._alliance + 1) % 2;
};

Game_Piece.prototype._forward = function() {
    return (this._alliance == 0 ? -1 : 1);
};

Game_Piece.prototype._movementRangeForOu = function() {
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

Game_Piece.prototype._movementRangeForHissha = function() {
    var range = [];
    range = range.concat(this._rangeInDirection(this._x, this._y, 0, -1));
    range = range.concat(this._rangeInDirection(this._x, this._y, -1, 0));
    range = range.concat(this._rangeInDirection(this._x, this._y, 1, 0));
    range = range.concat(this._rangeInDirection(this._x, this._y, 0, 1));
    if (this._promoted) {
        range.push([this._x - 1, this._y - 1]);
        range.push([this._x - 1, this._y + 1]);
        range.push([this._x + 1, this._y - 1]);
        range.push([this._x + 1, this._y + 1]);
    }
    return range;
};

Game_Piece.prototype._movementRangeForKaku = function() {
    var range = [];
    range = range.concat(this._rangeInDirection(this._x, this._y, -1, -1));
    range = range.concat(this._rangeInDirection(this._x, this._y, -1, 1));
    range = range.concat(this._rangeInDirection(this._x, this._y, 1, -1));
    range = range.concat(this._rangeInDirection(this._x, this._y, 1, 1));
    if (this._promoted) {
        range.push([this._x + 1, this._y]);
        range.push([this._x - 1, this._y]);
        range.push([this._x, this._y - 1]);
        range.push([this._x, this._y + 1]);
    }
    return range;
};

Game_Piece.prototype._movementRangeForKin = function() {
    var range = [];
    range.push([this._x - 1, this._y + this._forward()]);
    range.push([this._x, this._y + this._forward()]);
    range.push([this._x + 1, this._y + this._forward()]);
    range.push([this._x - 1, this._y]);
    range.push([this._x + 1, this._y]);
    range.push([this._x, this._y - this._forward()]);
    return range;
};

Game_Piece.prototype._movementRangeForGin = function() {
    var range = [];
    range.push([this._x - 1, this._y + this._forward()]);
    range.push([this._x, this._y + this._forward()]);
    range.push([this._x + 1, this._y + this._forward()]);
    range.push([this._x - 1, this._y - this._forward()]);
    range.push([this._x + 1, this._y - this._forward()]);
    return range;
};

Game_Piece.prototype._movementRangeForKeima = function() {
    var range = [];
    range.push([this._x - 1, this._y + this._forward() * 2]);
    range.push([this._x + 1, this._y + this._forward() * 2]);
    return range;
};

Game_Piece.prototype._movementRangeForFu = function() {
    return [[this._x, this._y + this._forward()]];
};

Game_Piece.prototype._movementRangeForKyo = function() {
    return this._rangeInDirection(this._x, this._y, 0, this._forward());
};