import { LightningElement,api,wire, track } from 'lwc';
import { getObjectInfo,getPicklistValues,getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
export default class DependentPicklist extends LightningElement {
   //public attribute for object selection
    @api
    objectApiName;
    //Public attribute for controlling picklist field
    @api
    controlFieldName;
    //Public attribute for dependent picklist field
    @api
    dependentFieldName;
     //Public attribute for recordtype id 
    @api
    recordTypeId='';
    //Public attribute for selected dependent picklist value
    @api
    dependentValue = '';
    //Public attribute for selected controlling picklist value 
    @api
    parentValue ='';
    //to stroe controlling picklist value options
    controlOptions =[];
    //to stroe dependent picklist value options based on the controlling picklist value
    dependentOptions = [];
    data = {};
    //to enable/disable the dependent picklist field in the UI - disabled it initially
    isDisabled = true;

    @track
    parentField = '';
    dependentField = '';

    //Wire method which fetches the object detatils with all the dependent picklist fields, record types, field details etc
    //based on the objectAPIName parameter
    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    objectInfo({error,data}) {
        if (data) {
            //set the default recordtype id if there is no given value
            if(!this.recordTypeId) {
                this.recordTypeId = data.defaultRecordTypeId;
            }
            //Check if any dependent picklist fields available for the consdiered object
            if(!(Object.keys(data.dependentFields).length === 0 && data.dependentFields.constructor === Object)){
                //check the given controlling field name is valid for this object or not, otherwise throw an appropriate error
                if(data.dependentFields.hasOwnProperty(this.controlFieldName)){
                    //console.log(data.dependentFields.hasOwnProperty(this.controlFieldName));
                    //check the given dependent field name is valid for this object or not, otherwise throw an appropriate error
                    if(!data.dependentFields[this.controlFieldName].hasOwnProperty(this.dependentFieldName)) {
                        console.log('error')
                        return;
                    }
                    //if the fields are valid, then pass the fieldAPIName in appropriate for the getPicklistValue object info wire method
                    //basically, controlling the wire parameters - no possibilty for imperative accessibility to UIObjectInfo API
                    this.parentField = this.generateFieldAPIName(this.controlFieldName);
                    this.dependentField = this.generateFieldAPIName(this.dependentFieldName);
                }
                else {
                    console.log('error')
                    return;
                }
            }
        }
    }

    //fethch the dependent picklist values based on the recordtype id and fieldAPI details
    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$dependentField' })
    fetchDependentOptions( {error , data }) {
        if(data) {
            const controlKeys = {};
            //Handling the validFor value which denotes the controlling fields. 
            //check the json format, controllerValues in field:index format and converts it into index:field format
            Object.keys(data.controllerValues).forEach((key) => {
                Object.defineProperty(controlKeys, data.controllerValues[key], {
                    value: key,
                    writable: false
                  });
                //create a dependent data skelton 
                Object.defineProperty(this.data, key, {
                    value : {values : [], default: false , defaultValue : ''},
                    writable : true
                });
            });
            //dependent data should be formatted as controllingField value as the key and related dependent options in an array
            //no need to iterate again when the controlling field value changes so this format would be helpful
            data.values.forEach((val) => {
                let option = {label : val.label, value : val.value};
                let isDefault = val.value === data.defaultValue.value ? true : false ; 
                val.validFor.forEach((key) => {
                    this.data[controlKeys[key]].values.push(option);
                    if(isDefault) {
                        this.data[controlKeys[key]].default = isDefault;
                        this.data[controlKeys[key]].defaultValue = val.value;
                    }
                });
            });
            //set the dependent options once the dependent data is ready
            this.setDependentOptions();
            //console.log(controlKeys);
            //console.log(this.data);
        }else{
            //handle the errors
            console.log(JSON.stringify(error));
            
        }
    }
    //fethch the controlling picklist values based on the recordtype id and fieldAPI details
    @wire(getPicklistValues,{ recordTypeId: '$recordTypeId', fieldApiName: '$parentField'})
    fetchControlOption( {error , data }) {
        if(data) {
            //sets the options to contriolling field 
            this.controlOptions = data.values.map((option) => {
                return {label : option.label, value : option.value};
            });
            //default value for the controlling field
            this.parentValue = data.defaultValue.hasOwnProperty('value') ? data.defaultValue.value : '';
            //initating to set the dependent option in the field
            this.setDependentOptions();
        }else{
            //handle the errors in an appropriate way
            console.log(JSON.stringify(error));
            
        }

        
        
    }

    setDependentOptions(){
        //only sets the dependent picklist options only if there any valid selection, valid depdendent data for the selected value
        if(this.parentValue && this.data && this.data.hasOwnProperty(this.parentValue)) {
            this.isDisabled = false;
            //fetching the options from the data array using the controlling value as index
            let selectOptions = this.data[this.parentValue];
            //sets the dependent options to the field
            this.dependentOptions = selectOptions.values;
            //set the default value
            if(selectOptions.default){
                this.dependentValue = selectOptions.defaultValue;
            }
        }
    }

    /*Handler for onchange event which initiate a custom event and set the value in the corresponding output attribute */
    handleControlChange(event) {
        this.parentValue = event.detail.value;
        this.setDependentOptions();
        this.dispatchEvent(new CustomEvent('controlchange',{detail : {value : this.parentValue}}));
    }
    /*Handler for onchange event which initiate a custom event and set the value in the corresponding output attribute */
    handleDependentChange(event) {
        this.dependentValue = event.detail.value;
        this.dispatchEvent(new CustomEvent('dependentchange',{detail : {value : this.dependentValue}}));
    }
    //define the fieldAPIName for the getPickListValue UI objectinfo api
    generateFieldAPIName(fieldName) {
        return {"objectApiName": this.objectApiName,"fieldApiName": fieldName };
    }

}