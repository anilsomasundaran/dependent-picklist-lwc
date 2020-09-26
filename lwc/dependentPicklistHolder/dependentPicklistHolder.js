import { api, LightningElement } from 'lwc';

export default class DepenndentPicklistHolder extends LightningElement {
    @api
    type;

    get isApex() {
        return this.type == 'Apex';
    }

    get isObjectInfo() {
        return this.type == 'ObjectInfoAPI';
    }

    get isRecordForm() {
        return this.type == 'RecordEditForm';
    }

    handleControlPLChange(event){}
    handleDependentPLchange(event){}
}