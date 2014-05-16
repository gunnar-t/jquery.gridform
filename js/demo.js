 $(document).ready(function(){
    
        var fields = {'1_1': {'id': 'login', 'label': 'Login', 'type': 'string', 'width': '150px'},
                '2_1': {'id': 'pwd', 'label': 'Password', 'type': 'string', 'pwd': true, 'width': '150px', 'maxLength': 10,},
                '3_1': {'id': 'pwdRepeat', 'label': 'Password repeat', 'type': 'string', 'pwd': true, 'maxLength': 10, 'width': '150px'},
                '3_2': {'id': 'new', 'label': 'New user', 'type': 'boolean', 'width': '150px'},
        };
        
        t1 = $().gridform({
            'name': 'form1',
            'debug': false,
            'fields': fields
            });
        t1.render("#example1",{showCellNames:true});
            
        t2 = $().gridform({
            'name': 'form2',
            'debug': false,
            'fields': fields
            });
        t2.render("#example2");
        
        //Add some fields
        var fields2 ={
            '1_1': {'id': 'caption', 'label': 'Caption', 'type': 'headline', 'colspan': 2},
            '2_1': {'id': 'login', 'label': 'Login', 'type': 'string', 'width': '150px'},
            '2_2': {'id': 'new', 'label': 'Description', 'type': 'text', 'width': '100%', 'rowspan': 3, 'placeholder': 'has a rowspan of 3'},
            '3_1': {'id': 'pwd', 'label': 'Password', 'type': 'string', 'pwd': true, 'width': '150px', 'maxLength': 10,},
            '4_1': {'id': 'pwdRepeat', 'label': 'Password repeat', 'type': 'string', 'pwd': true, 'maxLength': 10, 'width': '150px'},
            '5_1': {'id': 'url', 'label': 'Url', 'type': 'string', 'width': '100%', 'colspan': 2, 'placeholder': 'has a colspan of 2'},
            
        };
        
        t3 = $().gridform({
            'name': 'form3',
            'debug': false,
            'fields': fields2
            });
        t3.render("#example3");
        
   
       
        
        
        fields2['2_2'].placeholder = "now the label width of col_2 is 80px ... you see: much more space for the text field :)";
        t4 = $().gridform({
            'name': 'form4',
            'debug': false,
            'fields': fields2,
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"},
                       'col_2':{'labelWidth': '80px'}
                       }
            });
        t4.render("#example4");
        
        
       
        
        //Field types
        var fields3 ={         
            '1_1': {'id': 'string', 'label': 'string', 'type': 'string', 'width': '250px'},
            '2_1': {'id': 'pwd', 'label': 'pwd', 'type': 'string', 'pwd': true,  'width': '250px'},
            '3_1': {'id': 'text', 'label': 'text', 'type': 'text', 'width': '250px',},
            '4_1': {'id': 'select', 'label': 'select', 'type': 'select','width':'250px','selection': [{key:1,value:'first option'},{key:2,value:'second option'}]},
            '5_1': {'id': 'checkbox', 'label': 'checkbox', 'type': 'checkbox','selection': [{key:1,value:'first option'},{key:2,value:'second option'}]},
            '6_1': {'id': 'radio', 'label': 'radio', 'type': 'radio','selection': [{key:1,value:'first option'},{key:2,value:'second option'}]},
            '7_1': {'id': 'boolean', 'label': 'boolean', 'type': 'boolean'},
            '8_1': {'id': 'headline', 'label': 'headline', 'type': 'headline'},
            '9_1': {'id': 'separator', 'type': 'separator'},
        };
        
        t5 = $().gridform({
            'name': 'form5',
            'debug': false,
            'fields': fields3,
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t5.render("#example5");
        
        
        t5a = $().gridform({
            'name': 'form5a',
            'debug': false,
            'fields': {
                '1_1': {'id': 'select1', 'label': 'select with fixed choices', 'type': 'select','width':'250px','selection': [{key:1,value:'first option'},{key:2,value:'second option'}]},
                '2_1': {'id': 'select2', 'label': 'select with direct return function', 'type': 'select','width':'250px','selection': function(callback){                
                    var data = [];
                    for(var x = 0; x < 100; x++){
                        data.push({'key': x, 'value': 'Option '+x});
                    }
                    callback(data);
                }},
                '3_1': {'id': 'select3', 'label': 'select with (fake) ajax function', 'type': 'select','width':'250px','selection': function(callback){
                    
                        setTimeout(function(){
                            callback([{key:1,value:'first option'},{key:2,value:'second option'}]);
                        },2000);
                   }
                }
            },
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t5a.render("#example5a");
        
        
        
        
        t6 = $().gridform({
            'name': 'form6',
            'debug': false,
            'fields': {
                '1_1': {'id': 'text1', 'label': 'text1', placeholder:'text', 'type': 'string', 'width': '150px', mandatory: true, validate: function(value, callback){
                
                    if(value.length > 6){
                        callback(true);
                    } else {
                        callback("Please more than 6 characters!");
                    }
                
                }},
                '2_1': {'id': 'text2', 'label': 'text (with hasFeedback)', placeholder:'text', 'type': 'string', 'width': '150px', hasFeedback: true, mandatory: true, validate: function(value, callback){
                
                    if(value.length > 6){
                        callback(true);
                    } else {
                        callback("Please more than 6 characters!");
                    }
                
                }},
                '3_1': {'id': 'text3', 'label': 'validate on blur', placeholder:'text', 'type': 'string', 'width': '150px', mandatory: true, validateOnBlur: true}
                
            },
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"},
                       'col_2':{'labelWidth': '80px'}
                       }
            });
        t6.render("#example6");
        
        t7 = $().gridform({
            'name': 'form7',
            'debug': false,
            'successIsGreen': true,
            'fields': {
                '1_1': {'id': 'text1', 'label': 'text1', placeholder:'text', 'type': 'string', 'width': '150px', mandatory: true, validate: function(value, callback){
                
                    if(value.length > 6){
                        callback(true);
                    } else {
                        callback("Please more than 6 characters!");
                    }
                
                }},
                '2_1': {'id': 'text2', 'label': 'text (with hasFeedback)', placeholder:'text', 'type': 'string', 'width': '150px', hasFeedback: true, mandatory: true, validate: function(value, callback){
                
                    if(value.length > 6){
                        callback(true);
                    } else {
                        callback("Please more than 6 characters!");
                    }
                
                }},
                '3_1': {'id': 'text3', 'label': 'validate on blur', placeholder:'text', 'type': 'string', 'width': '150px', mandatory: true, validateOnBlur: true}
               },
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"},
                       'col_2':{'labelWidth': '80px'}
                       }
            });
        t7.render("#example7");
       
        
        t8 = $().gridform({
            'name': 'form8',
            'debug': false,
            'successIsGreen': true,
            'fields': {
                '1_1': {'id': 'field', 'label': 'string', placeholder:'string', 'hasFeedback': true, 'type': 'string', 'width': '150px'}
             },
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t8.render("#example8");
        
        
        var fields9 = {'1_1': {'id': 'login', 'label': 'Login', 'type': 'string', 'width': '150px'},
                '2_1': {'id': 'pwd', 'label': 'Password', 'type': 'string', 'pwd': true, 'width': '150px', 'maxLength': 10,},
                '3_1': {'id': 'pwdRepeat', 'label': 'Password repeat', 'type': 'string', 'pwd': true, 'maxLength': 10, 'width': '150px'},
             };        
        t9 = $().gridform({
            'name': 'form9',
            'debug': false,
            'fields': fields9,
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t9.render("#example9");
        
        
        fields9['3_1'] = {'id': 'product', 'label': 'Product', 'type': 'checkbox','selection': [{key:1,value:'Premium'},{key:2,value:'Gold'},{key:3,value:'Silver'}]};
        
        t10 = $().gridform({
            'name': 'form10',
            'debug': false,
            'fields': fields9,
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t10.render("#example10");
        
        
        t11 = $().gridform({
            'name': 'form11',
            'debug': false,
            'fields': fields9,
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t11.render("#example11");
        
        t11.switchLabelType = function(){
                       
            if(t11.settings.labelType === "over"){
                t11.settings.labelType = "inline";
            } else{
                t11.settings.labelType = "over";
            }
            t11.render();
        };
        t11.switchLabelAlign = function(){
            if(t11.settings.labelAlign === "left"){
                t11.settings.labelAlign = "right";
            } else {                
                t11.settings.labelAlign = "left";
            }
            t11.render()
        };
        
        
         t12 = $().gridform({
            'name': 'form12',
            'debug': false,
            'successIsGreen': false,
            'fields': {
                '1_1': {'id': 'checkbox', 'label': 'FontAwesome Checkbox', 'type': 'checkbox', 'mandatory': true, 'selection': [{key:1,value:'first option'},{key:2,value:'second option'}]},
                '2_1': {'id': 'radio', 'label': 'FontAwesome Radio', 'type': 'radio', 'mandatory': true, 'selection': [{key:1,value:'first option'},{key:2,value:'second option'}]},
             },
            'useFontAwesome': true,
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t12.render("#example12");
        
        
        var fields =  {'1_1': {'id':'headline', 'type': 'headline', 'label': 'Default style'},
                 '2_1': {'id': 'string', 'label': 'success', 'type': 'string', 'hasFeedback': true, 'width': '250px'},
                 '3_1': {'id': 'pwd', 'label': 'error', 'type': 'string', 'pwd': true, 'hasFeedback': true, 'width': '250px'},
                 '4_1': {'id': 'text', 'label': 'warning', 'type': 'text','hasFeedback': true, 'width': '250px',},
                 '5_1': {'id': 'string2', 'label': 'loading/waiting', 'type': 'string','hasFeedback': true, 'width': '250px',}
                }
        
        t13 = $().gridform({
            'name': 'form13',
            'debug': false,
            'successIsGreen': true,
            'fields': fields,          
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t13.render("#example13");
        t13.setError("pwd","This is a custom errror!");
        t13.setWarning("text","This is a custom errror!");
        t13.setSuccess("string");
        t13.setWaiting("string2");
        
        fields['1_1'].label = "Custom style";
        t14 = $().gridform({
            'name': 'form14',
            'debug': false,
            'successIsGreen': true,
            'fields': fields,  
            //Icons for the status
            icon_success : 'fa fa-thumbs-o-up',
			icon_error : 'fa fa-bug',
			icon_warning : 'fa fa-info-circle',
			icon_waiting : 'fa fa-spinner fa-spin',
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t14.render("#example14");
        t14.setError("pwd","This is a custom errror!");
        t14.setWarning("text","This is a custom errror!");
        t14.setSuccess("string");
        t14.setWaiting("string2");
        
        
        fields['1_1'].label = "Custom style";
        t15 = $().gridform({
            'name': 'form15',
            'debug': false,
            'successIsGreen': true,
            'showTooltipInstantly': true,
            'fields': {
                '1_1': {'id': 'string', 'label': 'String (id: string)', 'type': 'string', 'hasFeedback': true, 'width': '250px'}
            },
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t15.render('#example15');
        
        var elem = t15.getElement("string");
        elem.on("focus", function(){
            t15.setWarning("string","ups, custom focus handler");
        }).on("blur", function(){
            console.log("This is a custom handler");
            t15.validate("string");
        });
        
        
        //Custom field demo
        $('#zebra1').Zebra_DatePicker();
        
        
        gridform.addType("date",{
            // a simple render function
            render: function(data, cellSelector, parent){
                var disabled = (parent.settings.mode === "edit") ? '' : 'disabled';
                return '<input type="text" '+disabled+' class="form-control" style="color:#555;width:110px;border:0px;" value=""></input>';
            },
            //at least lock/unlock the field
            enable : function (data, enable, cellSelector) {

                if (enable === true) {
					$(cellSelector).find("input").removeAttr("disabled");
				} else if (enable === false) {
					$(cellSelector).find("input").attr("disabled", "disabled");
				}
                // set the locked status in the DatePicker
                var elem = $(cellSelector).find("input");
                elem.Zebra_DatePicker();

            },
            // after the element is in the DOM
            afterDOMCreation : function (data, cellSelector, parent){
                //add the date-picker
                var elem = $(cellSelector).find("input");
                elem.Zebra_DatePicker();
            }
        });
    
        t16 = $().gridform({
            'name': 'form16',
            'debug': false,
            'fields': {
                '1_1': {'id': 'date', 'label': 'Date', 'type': 'date'}
            },
            'dimensions': {'col_1':{'labelWidth': '120px','contentWidth': "200px"}}
            });
        t16.render('#example16');
        
        
     

        //CODE
        t = $("#fullExample").gridform({
            'name': 'form',
            'debug': false,
            'fields': {
                '1_1': {'id': 'serial', 'label': 'Personal data', 'type': 'headline',  'width': '100%', colspan:2},     
                
                '2_1': {'id': 'title', 'label': 'Title', 'type': 'select', 'width': '100px', mandatory: true,  'withoutPlaceholder': false,  'selection': [{'key':2,'value': 'Mr.'},{'key':3,'value':'Mrs.'}]},
                '2_2': {'id': 'title2', 'label': 'Send newsletter', 'type': 'boolean', 'width': '100px'},
                
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
                
                
                
                '5_2': {'id': 'description', 'label': 'Description', 'type': 'text',  'hasFeedback': true, 'width': '100%', 'colspan': 1, 'rowspan':3},
                
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
                '10_1': {'id': 'readonly', 'label': 'Read-only', 'type': 'string', 'width': '150px;', 'readonly': true},
                '10_2': {'id': 'date', 'label': 'Date', 'type': 'date'}
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
    
    
    function switchLabelStyle(obj){
        
        console.log(obj);
        if(obj.settings.labelType === "over"){
            obj.settings.labelType = "inline";
            obj.settings.labelAlign = "right";
        } else {
            obj.settings.labelType = "over";
            obj.settings.labelAlign = "left";
        }
        obj.render();
    
    }
    
    function registerHandler(obj){    
    
        //Change-Handler to "title"
        $(obj.getElement("title")).on("change", function(){        
            obj.validate("title");        
        });
        
        //Blur-Handler to lastname
        $(obj.getElement("lastname")).on("blur", function(){        
            obj.validate("lastname");        
        });
        
    };