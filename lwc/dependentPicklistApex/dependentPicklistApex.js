import { api, LightningElement, track, wire } from 'lwc';
import getPicklistValues  from '@salesforce/apex/DependentPicklistController.getPicklistValues';
const defaultOption = {label : '---None---',value: ''};
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
    data = [];
    //to enable/disable the dependent picklist field in the UI
    isDisabled = true;

    /*
        Wiring to getPicklistValues method defined in the apex class - DependentPicklistController
        which returns picklist values based on the paramteres object name, controlling Field and dependent field name */
    @wire(getPicklistValues,{objApiName : '$objectApiName', controlField : '$controlFieldName', dependentField:'$dependentFieldName'})
    picklistData({data,error}) {
        if(data){
            this.data = data;
            this.updateOptions();
            //console.log(JSON.stringify(data));
        }
        
    }
    //Sets the controlling field options to show
    updateOptions() {
        let defaultValue = '';
        this.controlOptions = this.data.map((option) => {
            if(option.defaultValue) {
                defaultValue = option.value;
            }
            return { label: option.label, value: option.value }
        });

        //show the default selected option as the first item in the dropdown otherwise --None--
        if(defaultValue){
            this.controlOptions.push(defaultOption);
            this.parentValue = defaultValue;
            this.updateDependentOptions();
            this.isDisabled = false;
        }else{
            //default --None-- Option is already set in the defaultOption constant
            this.controlOptions.unshift(defaultOption);
        }
    }
    
    //set the dependent options in the dropdown field
    updateDependentOptions() {
        let defaultValue = '';
        //fetch the selected option in the controlling field with it's dependent picklist values
        const selOptionDetail = this.data.filter(option => option.value === this.parentValue);
        //check the dependent option list empty or not and sets in to the dependent field, 
        //filter function returns an array so fetching the value in the 0th index
        if(selOptionDetail.length > 0 && selOptionDetail[0].dependents) {
            this.dependentOptions = selOptionDetail[0].dependents.map((option) => {
                if(option.defaultValue) {
                    defaultValue = option.value;
                }
                return { label: option.label, value: option.value }
            });
            //sets the default selected option or --None--
            if(defaultValue){
                this.dependentOptions.push(defaultOption);
                this.dependentValue = defaultValue;
            }else{
                this.dependentValue = '';
                this.dependentOptions.unshift(defaultOption);
            }
            //console.log(this.dependentOptions);
        }
    }

    /*Handler for onchange event which initiate a custom event and set the value in the corresponding output attribute */
    handleControlChange(event) {
        this.parentValue = event.detail.value;
        //enable the dependent picklist field - only needed for initial selection
        this.isDisabled = false;
        //update the dependent field option with newly selected control field value
        this.updateDependentOptions();
        this.dispatchEvent(new CustomEvent('controlchange',{detail : {value : this.parentValue}}));
    }
    /*Handler for onchange event which initiate a custom event and set the value in the corresponding output attribute */
    handleDependentChange(event) {
        this.dependentValue = event.detail.value;
        this.dispatchEvent(new CustomEvent('dependentchange',{detail : {value : this.dependentValue}}));
    }


}