//=============================================================================
// ** Game_Action
//=============================================================================

function Game_Action() {
    this.initialize.apply(this, arguments);
}

Game_Action.prototype.initialize = function(piece, action, destX, destY) {
    this._piece = piece;
    this._action = action;
    this._destX = destX;
    this._destY = destY;
    this._lastX = piece.x;
    this._lastY = piece.y;
};

Game_Action.prototype.execute = function() {
    switch (this._action) {
        case 'move':
            this._piece.moveTo(this._destX, this._destY);
            break;
        case 'drop':
            this._piece.moveTo(this._destX, this._destY);
            break;
        case 'capture':
            this._piece.capture();
            break;
        case 'promote':
            this._piece.promote();
            break;
        case 'demote':
            this._piece.demote();
            break;
    }
};

Game_Action.prototype.undo = function() {
    switch (this._action) {
        case 'move':
            this._piece.moveTo(this._lastX, this._lastY);
            break;
        case 'drop':
            this._piece.moveTo(-1, -1);
            break;
        case 'capture':
            this._piece.decapture(this._lastX, this._lastY);
            break;
        case 'promote':
            this._piece.demote();
            break;
        case 'demote':
            this._piece.promote();
            break;
    }
};

//=============================================================================
// ** Game_ActionList
//=============================================================================

function Game_ActionList() {
    this.initialize.apply(this, arguments);
}

Object.defineProperties(Game_ActionList.prototype, {
    actions: { get: function() { return this._actions; } },
    piece: { get: function() { return this._piece; } },
});

Game_ActionList.prototype.initialize = function(piece, destX, destY) {
    this._actions = [];
    this._piece = piece;
    this._createActions(piece, destX, destY);
};

Game_ActionList.prototype.isValid = function() {
    return this._actions.length > 0;
};

Game_ActionList.prototype.addAction = function(action) {
    this._actions.push(action);
};

Game_ActionList.prototype.execute = function() {
    for (var i = 0; i < this._actions.length; i++) {
        this._actions[i].execute();
    }
};

Game_ActionList.prototype.undo = function() {
    for (var i = this._actions.length - 1; i >= 0; i--) {
        this._actions[i].undo();
    }
};

Game_ActionList.prototype._createActions = function(piece, destX, destY) {
    if (piece.onBoard()) {
        this._createMoveActions(piece, destX, destY);
    } else {
        this._createDropActions(piece, destX, destY);
    }
};

Game_ActionList.prototype._createDropActions = function(piece, destX, destY) {
    var valid = BattleManager.board.isValid(destX, destY);
    var blocked = BattleManager.board.pieceAt(destX, destY);
    if (!valid || blocked) {
        return;
    }

    this._actions.push(new Game_Action(piece, 'drop', destX, destY));
};

Game_ActionList.prototype._createMoveActions = function(piece, destX, destY) {
    if (!piece.canMove(destX, destY)) {
        return;
    }

    var capturedPiece = BattleManager.board.pieceAt(destX, destY);
    if (capturedPiece) {
        if (capturedPiece.promoted) {
            this._actions.push(new Game_Action(capturedPiece, 'demote'));
        }
        this._actions.push(new Game_Action(capturedPiece, 'capture'));
    }

    this._actions.push(new Game_Action(piece, 'move', destX, destY));
};

//=============================================================================
// ** Game_AI
//=============================================================================

function Game_AI() {
    this.initialize.apply(this, arguments);
};

Object.defineProperties(Game_AI.prototype, {
    alliance: { get: function() { return this._alliance; } },
});

Game_AI.prototype.initialize = function(alliance) {
    this._alliance = alliance;
};

Game_AI.prototype.takeTurn = function() {
    var moves = this._getAllActions();
    var action = moves[Math.floor(Math.random() * moves.length)];
    Game.processEvent(action, false);
};

Game_AI.prototype._getAllActions = function() {
    var moves = [];
    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 9; x++) {
            for (var i = 0; i < BattleManager.board.pieces.length; i++) {
                var piece = BattleManager.board.pieces[i];
                if (piece.alliance !== this._alliance) {
                    continue;
                }
                
                moves = moves.concat(this._getPossibleActions(piece, x, y));
            }
        }
    }
    
    return moves;
};

Game_AI.prototype._getPossibleActions = function(piece, destX, destY) {
    var actions = [];

    var actionList = new Game_ActionList(piece, destX, destY);
    if (!actionList.isValid()) {
        return actions;
    }

    if (piece.onBoard()) {
        if (piece.mustPromote(destX, destY)) {
            actionList.addAction(new Game_Action(piece, 'promote'));
        } else if (piece.canPromote(destY)) {
            var promoteActionList = new Game_ActionList(piece, destX, destY);
            promoteActionList.addAction(new Game_Action(piece, 'promote'));
            actions.push(promoteActionList);
        }
    }

    actions.push(actionList);
    return actions;
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

Game_Board.prototype.isValid = function(x, y) {
    return (x >= 0 && x < 9 && y >= 0 && y < 9);
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

Game_Board.prototype.capturedPiecesCount = function(id, alliance) {
    var count = 0;

    for (var i = 0; i < this._pieces.length; i++) {
        var piece = this._pieces[i];
        if (piece.id != id || piece.alliance != alliance || piece.onBoard()) {
            continue;
        }
        count++;
    }

    return count;
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
        if (this._alliance == 0) {
            return (Game.WINDOW_WIDTH - 576) / 2 - 160;
        } else {
            return (Game.WINDOW_WIDTH - 576) / 2 + 576 + 96;
        }
    } else {
        return this._x * 64 + (Game.WINDOW_WIDTH - 576) / 2;
    }
};

Game_Piece.prototype.screenY = function() {
    if (this._y < 0) {
        return (Game.WINDOW_HEIGHT - 576) / 2 + this._id * 64;
    } else {
        return this._y * 64 + (Game.WINDOW_HEIGHT - 576) / 2;
    }
};

Game_Piece.prototype.onBoard = function() {
    return this._x >= 0 && this._y >= 0;
};

Game_Piece.prototype.canMove = function(x, y) {
    var range = this._getMovementRange();
    for (var i = 0; i < range.length; i++) {
        if (x == range[i][0] && y == range[i][1]) {
            return true;
        }
    }
    return false;
};

Game_Piece.prototype.canPromote = function(y) {
    if (this._promoted) {
        return false;
    }

    if (this._alliance == 0) {
        return y <= 2;
    } else {
        return y >= 6;
    }
};

Game_Piece.prototype.mustPromote = function(x, y) {
    if (!this.canPromote(y)) {
        return false;
    }

    var oldX = this.x;
    var oldY = this.y;


    this.moveTo(x, y);
    var promote = this.getBaseMovementRange().length == 0;
    this.moveTo(oldX, oldY);

    return promote;
};

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

Game_Piece.prototype._switchAlliance = function() {
    this._alliance = (this._alliance + 1) % 2;
};

Game_Piece.prototype._forward = function() {
    return (this._alliance == 0 ? -1 : 1);
};

Game_Piece.prototype.getBaseMovementRange = function() {
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
        if (!BattleManager.board.isValid(range[i][0], range[i][1])) {
            range.splice(i, 1);
        }
    }

    return range;
};

Game_Piece.prototype._getMovementRange = function() {
    var range = this.getBaseMovementRange();
    for (var i = range.length - 1; i >= 0; i--) {
        var occupyPiece = BattleManager.board.pieceAt(range[i][0], range[i][1]);
        if (occupyPiece && occupyPiece.alliance == this._alliance) {
            range.splice(i, 1);
        }
    }

    return range;
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

Game_Piece.prototype._nodesInDirection = function(sx, sy, xDir, yDir) {
    var range = [];

    var i = xDir;
    var j = yDir;
    
    while (true) {
        if (!BattleManager.board.isValid(sx + i, sy + j)) {
            break;
        }
        range.push([sx + i, sy + j]);
        if (BattleManager.board.pieceAt(sx + i, sy + j)) {
            break; 
        }
        
        i += xDir;
        j += yDir;
    }

    return range;
};

Game_Piece.prototype._rangeInDirection = function(sx, sy, xDir, yDir) {
    return this._nodesInDirection(sx, sy, xDir, yDir);
};