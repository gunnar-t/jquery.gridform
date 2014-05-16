
var t = null;


$(document).ready(function(){

    gridform.addType("picture",{
            
        
        render: function(){
            return '<div style="text-align:center;">'
            +'<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIj48cmVjdCB3aWR0aD0iMTQwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjcwIiB5PSI3MCIgc3R5bGU9ImZpbGw6I2FhYTtmb250LXdlaWdodDpib2xkO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtZmFtaWx5OkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmO2RvbWluYW50LWJhc2VsaW5lOmNlbnRyYWwiPjE0MHgxNDA8L3RleHQ+PC9zdmc+" alt="thumbnail" class="img-thumbnail"></div>';
            
        }
       
    });


    //CODE
    t = $("#test1").gridform({
        'name': 'form',
        'debug': false,
        'fields': {
            '1_1': {'id': 'serial', 'label': 'Headline', 'type': 'headline',  'width': '100%', colspan:2},     
            
            '2_1': {'id': 'title', 'label': 'Title', 'type': 'select', 'width': '100px', mandatory: true,  'withoutPlaceholder': false,  'selection': [{'key':2,'value': 'Mr.'},{'key':3,'value':'Mrs.'}]},
            '2_2': {'id': 'title2', 'label': 'Check', 'type': 'boolean', 'width': '100px'},
            
            '3_1': {'id': 'lastname', 'label': 'Lastname', placeholder:'Lastname', 'type': 'string', 'hasFeedback': true, 'width': '100%', mandatory: true},
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
            
            '1_3': {'id': 'userPictureHeadline', 'type': 'headline', 'label': 'Custom Type'},
            '2_3': {'id': 'userPicture', 'type': 'picture',   'rowspan': 6},
            
            '5_2': {'id': 'description', 'label': 'Description', 'type': 'text',  'hasFeedback': true, 'width': '100%', 'colspan': 1, 'rowspan':3},
            
            '4_1': {'id': 'dsf', 'type': 'headline', 'label': 'Some more data', colspan:2},
            '5_1': {'id': 'lastname1', 'label': 'Nachname1', 'type': 'string',  'pwd': true,  'validateOnBlur': true, 'hasFeedback': true, 'mandatory': true, validate: function(value, callback){
                
                setTimeout(function(){
                    if(value === "Test"){
                        callback(true);
                    }else {
                        callback("The field is not set to 'Test'");
                    }
                },1000);
            }},
            '6_1': {'id': 'desc', 'label': 'Auswahl1', 'type': 'select', 'width': '100%','hasFeedback': false, 'selection': [{'key':1,'value': 'Auto'},{'key':2,'value':'Test'}]},
            '7_1': {'id': 'desc2', 'label': 'None',  'type': 'select', 'width': '100%', 'selection': function(setDataCallback){
                setTimeout(function(){
                    var data = [{'key':1,'value': 'Muh'},{'key':2,'value':'Mäh'}];
                    setDataCallback(data);
                },2000);
            }},
            '8_1': {'id': 'sep1', 'type': 'separator', colspan:3},
            '9_1': {'id': 'check', 'label': 'Belag', 'type': 'checkbox', 'width': '100%', 'mandatory': true, 'selection': [{'key':1,'value': 'Auto'},{'key':2,'value':'Test'},{'key': 3, 'value': 'Kaese'}]},
            '9_2': {'id': 'radio', 'label': 'Belag', 'type': 'radio', 'width': '100%', 'mandatory': true,  'selection': [{'key':1,'value': 'Auto'},{'key':2,'value':'Test'},{'key':5,'value': 'UPS'}]},
            '10_1': {'id': 'readonly', 'label': 'SerialNo.', 'type': 'string', 'width': '150px;', 'readonly': true}
            
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
                    
         
    });
    
    
    //t.render("#test1",{showCellNames:true});

    //Handler auf das Element setzen
    $(t).bind("rendered",function(e, data){
        console.log(data);
        console.log("das Event 'render' meldet, dass ich zum "+ data.rendered + " mal gerendert wurde....");
    });
    
    
    //Handler auf das Element setzen
    $(t).bind("validated",function(e, data){
        console.log(data);
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

