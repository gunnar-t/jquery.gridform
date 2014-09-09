
var t = null;


$(document).ready(function(){

    

    //CODE
        t = $("#fullExample").gridform({
            'name': 'form',
            'debug': false,
            'fields': {
                '1_1': {'id': 'serial', 'label': 'Personal data', 'type': 'headline',  'width': '100%', colspan:2},     
                
                '2_1': {'id': 'title', 'label': 'Title', 'type': 'select', 'width': '100px', mandatory: true,  'withoutPlaceholder': false,  'selection': [{'key':2,'value': 'Mr.'},{'key':3,'value':'Mrs.'}]},
                '2_2': {'id': 'title2', 'label': 'Send newsletter', 'type': 'boolean', 'width': '100px'},
                
                '3_1': {'id': 'lastname', 'label': 'Lastname', placeholder:'Lastname', 'hasFocus': true, 'type': 'string', 'hasFeedback': true, 'width': '100%', mandatory: true},
                '3_2': {'id': 'firstname', 'label': 'Firstname', placeholder:'Firstname', 'type': 'string', 'hasFeedback': true, 'width': '100%', mandatory: true, validate: function(value, callback){
                    
                    if(value.length > 6){
                        callback(true);
                    } else {
                        //Validate with warning and set an error?!
                        //callback("ERROR");
                        //or with no error
                        callback(true);
                        t.setWarning("firstname","A littlebit short");
                    }
                    
                }},
                
                
                
                '5_2': {'id': 'description', 'label': 'Description', 'type': 'text', 'hasFeedback': true, 'width': '100%', 'colspan': 1, 'rowspan':3},
                
                '4_1': {'id': 'dsf', 'type': 'headline', 'label': 'Your profession', colspan:2},
                '5_1': {'id': 'company', 'label': 'Company', 'type': 'string', 'validateOnBlur': true, 'hasFeedback': true, 'mandatory': true, validate: function(value, callback){
                    
                    setTimeout(function(){
                        if(value === "Test"){
                            callback(true);
                        }else {
                            callback("The field is not set to 'Test'");
                        }
                    },1000);
                }},
                '6_1': {'id': 'desc', 'label': 'Area', 'type': 'select', 'width': '100%','hasFeedback': false, 'selection': [{'key':1,'value': 'Aerospace'},{'key':2,'value':'Food'},{'key':3,'value':'IT'},
                          {'key':4,'value':'Music business'}]},
                '7_1': {'id': 'desc2', 'label': 'Your job',  'type': 'select', 'width': '100%', 'selection': function(setDataCallback){
                    setTimeout(function(){
                        var data = [{'key':1,'value': 'Leader'},{'key':2,'value':'Hard worker'}];
                        setDataCallback(data);
                    },2000);
                }},
                '8_1': {'id': 'sep1', 'type': 'separator', colspan:2},
                '9_1': {'id': 'check', 'label': 'You want more ...', 'type': 'checkbox', 'width': '100%', 'mandatory': true, 'selection': [{'key':1,'value': 'money'},{'key':2,'value':'power'},{'key': 3, 'value': 'sparetime'}]},
                '9_2': {'id': 'radio', 'label': 'You want less ...', 'type': 'radio', 'width': '100%', 'mandatory': true,  'inline': true, 'selection': [{'key':1,'value': 'work'},{'key':2,'value':'stupid questions'},{'key':5,'value': 'noobies'}]},
                '10_1': {'id': 'readonly', 'label': 'Read-only', 'type': 'string', 'width': '150px;', 'readonly': true}
            },

            'record': { 'lastname': '', 'readonly': 'AX-345/345'},
            'mode': 'edit',
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"},
                           'col_2':{'labelWidth': '120px'},
                           'col_3': {'labelWidth': 0, 'contentWidth': '170px'}
                           },
            'useFontAwesome': true,
            'icon_waiting': 'fa fa-spinner fa-spin',
            'showTooltipInstantly': false,
            'successIsGreen': true,
            'markMandatoryFields': true,
                        
             
        });
        
        
        //t.render("#test1",{showCellNames:true});

        //Set handler to the element
        $(t).bind("rendered",function(e, data){
            console.log(data);
            console.log("das Event 'render' meldet, dass ich zum "+ data.rendered + " mal gerendert wurde....");
        });
        
        $(t).bind("validated",function(e, data){
            console.log("Return event: "+data);
        });

        
        /*
        t.setSuccess("firstname");
        t.setWarning("lastname","No name");
        t.setError("password","At least 8 characters");
        
        t.setError("desc","At least 8 characters");
        */
        
        $('#validate').on("click",function(){
            t.validate(undefined, function(data){
                if(data === false){
                    console.log("Validated to: FALSE");
                } else {
                    console.log("Validated to:  TRUE");
                }
            });
        
        });
    


});

