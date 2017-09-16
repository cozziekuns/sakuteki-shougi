//=============================================================================
// ** Dialog_Base
//=============================================================================

function Dialog_Base() {
    this.initialize.apply(this, arguments);
}

Dialog_Base.prototype.initialize = function() {

};

//=============================================================================
// ** Dialog_Promotion
//=============================================================================

function Dialog_Promotion() {
    this.initialize.apply(this, arguments);
}

Dialog_Promotion.prototype = Object.create(Dialog_Base);
Dialog_Promotion.prototype.constructor = Dialog_Promotion;