import { LightningElement,api } from 'lwc';

export default class DependentPicklistRecordEditForm extends LightningElement {
    
    //Public attribute for object
    @api
    objectApiName = '';
    //Public attribute for controlling picklist field
    @api
    controlFieldName = '';
    //Public attribute for dependent picklist field
    @api
    dependentFieldName = '';
    //Public attribute for record type id
    @api
    recordTypeId='012000000000000AAA';
    //Public attribute for selected dependent picklist value 
    @api
    dependentValue = '';
    //Public attribute for selected controlling picklist value 
    @api
    parentValue ='';

    /*Handler for onchange event which initiate a custom event and set the value in the corresponding output attribute */
    handleControlChange(event){
        console.log(event.target.value);
        this.parentValue = event.target.value;
        this.dispatchEvent(new CustomEvent('controlchange',{detail : {value : this.parentValue}}));
    }
    /*Handler for onchange event which initiate a custom event and set the value in the corresponding output attribute */
    handleDependentChange(event){
        console.log(event.target.value);
        this.dependentValue = event.target.value;
        this.dispatchEvent(new CustomEvent('dependentchange',{detail : {value : this.dependentValue}}));
    }
}