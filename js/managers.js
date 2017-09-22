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
    this._createFogs();
};

BattleManager.isPlayerTurn = function() {
    return this.turn === this.player.alliance;
};

BattleManager.getFog = function(alliance) {
    if (alliance == this.player.alliance) {
        return this.playerFog;
    }

    return this.enemyFog;
}

BattleManager.queueAction = function(actionList) {
    this._actionQueue.push(actionList);
};

BattleManager.performNextAction = function() {
    this._actionQueue[this._actionIndex].execute();
    this._actionIndex += 1;
};

BattleManager.undoPreviousAction = function() {
    this._actionIndex -= 1;
    this._actionQueue[this._actionIndex].undo();
};

BattleManager.popAction = function() {
    this._actionQueue.pop();
};

BattleManager.advanceTurn = function() {
    this.turn = (this.turn + 1) % 2;
    if (this.turn == this.enemy.alliance) {
        this.enemy.takeTurn();
    } 
};

BattleManager.endTurn = function() {
    BattleManager.playerFog.refresh();
    BattleManager.enemyFog.refresh();

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
    this.player = new Game_Player(Math.floor(Math.random() * 2));
    this.enemy = new Game_AI((this.player.alliance + 1) % 2);
};

BattleManager._createFogs = function() {
    this.playerFog = new Game_Fog(this.player.alliance);
    this.enemyFog = new Game_Fog(this.enemy.alliance);
};