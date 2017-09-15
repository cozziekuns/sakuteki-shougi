//=============================================================================
// ** BattleManager
//=============================================================================

function BattleManager() {
    throw new Error('This is a static class');
}

BattleManager.init = function() {
    this.board = new Game_Board();
    this._actionQueue = [];
    this._actionIndex = 0;
};

BattleManager.getBoard = function() {
    return this._board;
};

BattleManager.queueAction = function(actionList) {
    this._actionQueue.push(actionList);
};

BattleManager.performNextAction = function() {
    var actionList = this._actionQueue[this._actionIndex];
    for (var i = 0; i < actionList.length; i++) {
        actionList[i].execute();
    }
    this._actionIndex += 1;
};

BattleManager.undoPreviousAction = function() {
    var actionList = this._actionQueue[this._actionIndex];
    for (var i = actionList.length - 1; i >= 0; i--) {
        actionList[i].undo();
    }
    this._actionIndex -= 1;
};