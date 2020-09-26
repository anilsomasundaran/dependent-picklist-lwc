public with sharing class DependentPicklistController {
            
    @AuraEnabled(cacheable = true)
    public static List<PicklistValue> getPicklistValues(String objApiName, String controlField, String dependentField){
        List<PicklistValue> pickListValues = new List<PicklistValue>();
        if(String.isBlank(objApiName) || String.isBlank(controlField) || String.isBlank(dependentField)) {
            //return pickListValues;
            objApiName = 'Account';
            controlField ='Country__c';
            dependentField= 'State__c';
            //enable the return statement and remove the above static assignment with some valid error value to update the UI
            //return;
        }
        
        //Identify the sobject type from the object name using global schema describe function
        Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objApiName);
        //Create an empty object based up on the above the sobject type to get all the field names
        Schema.sObjectType objType = targetType.newSObject().getSobjectType();
        //fetch the all fields defined in the sobject
        Map<String, Schema.SObjectField> objFieldMap = objType.getDescribe().fields.getMap();
        //Get the controlling and dependent picklist values from the objFieldMap
        List<Schema.PicklistEntry> controlledPLEntries = objFieldMap.get(controlField).getDescribe().getPicklistValues();
        List<Schema.PicklistEntry> dependentPLEntries = objFieldMap.get(dependentField).getDescribe().getPicklistValues();

        // Wrap the picklist values using custom wrapper class - PicklistValue
        for (Schema.PicklistEntry entry : controlledPLEntries) {
            PicklistValue picklistValue = new PicklistValue(entry.isActive(), entry.isDefaultValue(), entry.getLabel(), entry.getValue());
            pickListValues.add(picklistValue);
        }
        //ValidFor is an indicator value for the controlling field which is base64 encrypted
        //base64 value should be convered to 6bit grouped binary and 1 indicate the controlling field in a certain order
        //Also,validFor value only be shown when it is serialized so it should be serialized then deserialized using PicklistValue wrapper class
        for(PicklistValue plVal : deserializePLEntries(dependentPLEntries)) {
            String decodedInBits = base64ToBits(plVal.validFor);
            
            for(Integer i = 0; i< decodedInBits.length(); i++) {
                // For each bit, in order: if it's a 1, add this label to the dependent list for the corresponding controlling value
				String bit = decodedInBits.mid(i, 1);
                if (bit == '1') {
                    PicklistValue dependentPLValue = new PicklistValue(plVal.active, plVal.defaultValue, plVal.label, plVal.value);
                    //Dependent picklist value is mapped to its parent controlling value through 'dependents' attribute in the PicklistValue wrapper class
                    if(pickListValues.get(i).dependents == null ) {
                        pickListValues.get(i).dependents = new List<PicklistValue>{dependentPLValue};
                    }else{
                        pickListValues.get(i).dependents.add(dependentPLValue);
                    }
                }
            }
        }
        return pickListValues;
    }

    private static List<PicklistValue> deserializePLEntries(List<Schema.PicklistEntry> plEntries) {
		return (List<PicklistValue>)
			JSON.deserialize(JSON.serialize(plEntries), List<PicklistValue>.class);
    }
    //Available base64 charecters
    private static final String BASE_64_CHARS = '' +'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +'abcdefghijklmnopqrstuvwxyz' +'0123456789+/';
    
    // Convert decimal to binary representation (alas, Apex has no native method :-(
	//    eg. 4 => '100', 19 => '10011', etc.
	// Method: Divide by 2 repeatedly until 0. At each step note the remainder (0 or 1).
	// These, in reverse order, are the binary.
	private static String decimalToBinary(Integer val) {
		String bits = '';
		while (val > 0) {
			Integer remainder = Math.mod(val, 2);
			val = Integer.valueOf(Math.floor(val / 2));
			bits = String.valueOf(remainder) + bits;
		}
		return bits;
	}

	// Convert a base64 token into a binary/bits representation
	// e.g. 'gAAA' => '100000000000000000000'
	private static String base64ToBits(String validFor) {
        if (String.isEmpty(validFor)) {
            return '';
        }

		String validForBits = '';

		for (Integer i = 0; i < validFor.length(); i++) {
			String thisChar = validFor.mid(i, 1);
			Integer val = BASE_64_CHARS.indexOf(thisChar);
			String bits = decimalToBinary(val).leftPad(6, '0');
			validForBits += bits;
		}

		return validForBits;
	}

    //Wrapper class

    public class PicklistValue {
        @AuraEnabled
        public Boolean active { get; set; }
        @AuraEnabled
        public Boolean defaultValue { get; set; }
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String validFor { get; set; }
        @AuraEnabled
        public String value { get; set; }
        
        @AuraEnabled
        public List<PickListValue> dependents {get; set;}
        
        public PicklistValue(){}
        
        public PicklistValue(Boolean active, Boolean defaultValue, String label, String validFor, String value) {
            this.active = active;
            this.defaultValue = defaultValue;
            this.label = label;
            this.validFor = validFor;
            this.value = value;
        }

        public PicklistValue(Boolean active, Boolean defaultValue, String label, String value) {
            this.active = active;
            this.defaultValue = defaultValue;
            this.label = label;
            this.validFor = validFor;
            this.value = value;
        }

        public PicklistValue(String label, String value) {
            this.label = label;
            this.value = value;
        }

    }

    
}