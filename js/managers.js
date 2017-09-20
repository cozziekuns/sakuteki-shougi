//=============================================================================
// ** BattleManager
//=============================================================================

function BattleManager() {
    throw new Error('This is a static class');
}

BattleManager.init = function() {
    this.board = new Game_Board();
    this.turn = -1;
    this._actionQueue = [];
    this._actionIndex = 0;
    this._createPlayers();
};

BattleManager.isPlayerTurn = function() {
    return this.turn === this._playerTurn;
};

BattleManager.requestAction = function(actionList) {
    this.queueAction(actionList);
    this.performNextAction();
};

BattleManager.queueAction = function(actionList) {
    this._actionQueue.push(actionList);
};

BattleManager.performNextAction = function() {
    this._actionQueue[this._actionIndex].execute();
    this._actionIndex += 1;
};

BattleManager.undoPreviousAction = function() {
    this._actionQueue[this._actionIndex].undo();
    this._actionIndex -= 1;
};

BattleManager.advanceTurn = function() {
    this.turn = (this.turn + 1) % 2;
    if (this.turn == this.enemy.alliance) {
        this.enemy.takeTurn();
    } 
};

BattleManager.endTurn = function() {
    switch (this.judgeWinLoss()) {
        case 0:
            this.advanceTurn();
            break;
        case 1:
            Game.showWinDialog();
            break;
        case 2:
            Game.showLossDialog();
            break;
    } 
};

BattleManager.judgeWinLoss = function() {
    return 0;
};

BattleManager._createPlayers = function() {
    this._playerTurn = Math.floor(Math.random() * 2);
    this.enemy = new Game_AI((this._playerTurn + 1) % 2);
};