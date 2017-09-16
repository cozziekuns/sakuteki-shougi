//=============================================================================
// ** BattleManager
//=============================================================================

function BattleManager() {
    throw new Error('This is a static class');
}

BattleManager.init = function() {
    this.board = new Game_Board();
    this.turn = 0;
    this._actionQueue = [];
    this._actionIndex = 0;
};

BattleManager.requestAction = function(actionList) {
    this.queueAction(actionList);
    this.performNextAction();
};

BattleManager.queueAction = function(actionList) {
    this._actionQueue.push(actionList);
};

BattleManager.performNextAction = function() {
    var actionList = this._actionQueue[this._actionIndex];
    for (var i = 0; i < actionList.length; i++) {
        actionList.actions[i].execute();
    }
    this._actionIndex += 1;
};

BattleManager.undoPreviousAction = function() {
    var actionList = this._actionQueue[this._actionIndex];
    for (var i = actionList.length - 1; i >= 0; i--) {
        actionList[i].actions[i].undo();
    }
    this._actionIndex -= 1;
};

BattleManager.advanceTurn = function() {
    this.turn = (this.turn + 1) % 2;
};