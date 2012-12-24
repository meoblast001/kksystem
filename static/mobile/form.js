/*
Copyright (C) 2012 Braden Walters

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
Constructs a form from an object and handles the results when submitted.
Annotated example of configuration: {
  on_submit : function(post_data, submit_event)
    {
      //Triggered when the form is submitted. Receives an object where keys are
      //field names and values are the field value and a Form.SubmitEvent
      //object.
    },
  fields : [
      {
        type : 'text', //Creates a single-lined text input.
        name : 'name_of_field', //Name of field element.
        attributes : {
            //Other HTML attributes for field.
          },
        label : 'Name of Field' //Optional label to display above the field.
                                //Will be omitted from following fields, but can
                                //be used with all fields.
      },
      {
        type : 'password', //Creates a single-lined password text input.
        name : 'name_of_field' //Name of field element.
        attributes : {
            //Other HTML attributes for field.
          },
      },
      {
        type : 'hidden', //Creates an invisible input.
        name : 'name_of_field' //Name of field element.
        attributes : {
            //Other HTML attributes for field.
          },
      },
      {
        type : 'textarea', //Creates a multi-line text area.
        name : 'name_of_field' //Name of field element.
        attributes : {
            //Other HTML attributes for field.
          },
      },
      {
        type : 'select', //Creates a drop-down select menu.
        name : 'name_of_field' //Name of field element.
        attributes : {
            //Other HTML attributes for field.
          },
        options : {
            value_of_option_1 : 'Label of Option 1',
            value_of_option_2 : 'Label of Option 2',
            //...
          }
      },
      {
        type : 'radio', //Creates a list of radio buttons.
        name : 'name_of_field' //Name of field element.
        attributes : {
            //Other HTML attributes for field.
          },
        options : {
            value_of_radio_1 : 'Label of Radio 1',
            value_of_radio_2 : 'Label of Radio 2',
            //...
          }
      }
    ],
  buttons : [
      {
        type : 'submit', //Creates a submit button.
        name : 'submit', //Name of submit button.
        value : 'Submit' //Value (text) of button.
      },
      {
        type : 'clear', //Creates a clear button.
        name : 'clear', //Name of clear button.
        value : 'Clear' //Value (text) of button.
      }
    ]
}
*/
var Form = (function()
{
  //Object of functions related to the fields in the form.
  var field_functions = {
    /**
    Object of field generators by type.
    @param config Field configuration.
    @return Base element of field.
    */
    generate : {
        text : function(config)
          {
            if (config.name === undefined)
              return null;
            var node = document.createElement('input');
            node.setAttribute('type', 'text');
            node.setAttribute('name', config.name);
            for (key in config.attributes)
              node.setAttribute(key, config.attributes[key]);
            return node;
          },
        password : function(config)
          {
            if (config.name === undefined)
              return null;
            var node = document.createElement('input');
            node.setAttribute('type', 'password');
            node.setAttribute('name', config.name);
            for (key in config.attributes)
              node.setAttribute(key, config.attributes[key]);
            return node;
          },
        hidden : function(config)
          {
            if (config.name === undefined)
              return null;
            var node = document.createElement('input');
            node.setAttribute('type', 'hidden');
            node.setAttribute('name', config.name);
            for (key in config.attributes)
              node.setAttribute(key, config.attributes[key]);
            return node;
          },
        textarea : function(config)
          {
            if (config.name === undefined)
              return null;
            var node = document.createElement('textarea');
            node.setAttribute('name', config.name);
            for (key in config.attributes)
              node.setAttribute(key, config.attributes[key]);
            return node;
          },
        select : function(config)
          {
            if (config.name === undefined)
              return null;
            var node = document.createElement('select');
            node.setAttribute('name', config.name);
            for (key in config.attributes)
              node.setAttribute(key, config.attributes[key]);
            for (value in config.options)
            {
              var o_node = document.createElement('option');
              o_node.setAttribute('value', value);
              o_node.appendChild(
                document.createTextNode(config.options[value]));
              for (key in config.options[value].attributes)
                o_node.setAttribute(key, config.options[value].attributes[key]);
              node.appendChild(o_node);
            }
            return node;
          },
        radio : function(config)
          {
            if (config.name === undefined)
              return null;
            var node = document.createElement('div');
            node.setAttribute('name', config.name);
            for (value in config.options)
            {
              var r_node = document.createElement('input');
              r_node.setAttribute('type', 'radio');
              r_node.setAttribute('name', config.name);
              r_node.setAttribute('value', value);
              for (key in config.options[value].attributes)
                r_node.setAttribute(key, config.options[value].attributes[key]);
              var label = document.createElement('label');
              label.appendChild(r_node);
              label.appendChild(document.createTextNode(config.options[value]));
              node.appendChild(label);
              node.appendChild(document.createElement('br'));
            }
            return node;
          }
      },
    /**
    Object of functions to set the value of fields by type.
    @param element Field element
    @param value Value to assign to field.
    */
    set_value : {
        text : function(element, value)
          {
            element.setAttribute('value', value);
          },
        password : function(element, value)
          {
            element.setAttribute('value', value);
          },
        hidden : function(element, value)
          {
            element.setAttribute('value', value);
          },
        textarea : function(element, value)
          {
            for (var i = 0; i < element.childNodes.length; ++i)
              element.removeChild(element.childNodes[i]);
            element.appendChild(document.createTextNode(value));
          },
        select : function(element, value)
          {
            for (var i = 0; i < element.childNodes.length; ++i)
            {
              var option_element = element.childNodes[i];
              if (option_element.getAttribute('value') == value)
                option_element.setAttribute('selected', 'selected');
            }
          },
        radio : function(element, value)
          {
            for (var i = 0; i < element.childNodes.length; ++i)
            {
              var radio_element = element.childNodes[i];
              if (radio_element.getAttribute('value') == value)
                radio_element.setAttribute('checked', 'checked');
            }
          }
      }
  }

  /**
  Collects data POSTed by the form.
  @param element Form element.
  @return Object linking field names (or ID if none) to values.
  */
  function collectPostData(element)
  {
    var post_data = {};
    for (var i = 0; i < element.childNodes.length; ++i)
    {
      var field_node = element.childNodes[i];
      var field_node_name = field_node.nodeName.toLowerCase();
      if (field_node_name == 'input')
      {
        var type = field_node.getAttribute('type').toLowerCase();
        if (type == 'text' || type == 'password' || type == 'hidden' ||
            (type == 'checkbox' && field_node.checked))
          post_data[field_node.name || field_node.id] = field_node.value;
      }
      else if (field_node_name == 'textarea')
        post_data[field_node.name || field_node.id] = field_node.value;
      else if (field_node_name == 'select')
      {
        var options = field_node.getElementsByTagName('option');
        for (var j = 0; j < options.length; ++j)
          if (options[j].selected)
            post_data[field_node.name || field_node.id] = options[j].value;
      }
      else if (field_node_name == 'div')
      {
        var inputs = field_node.getElementsByTagName('input');
        for (var j = 0; j < inputs.length; ++j)
          if (inputs[j].checked)
            post_data[field_node.getAttribute('name') || field_node.id] =
              inputs[j].value;
      }
    }
    return post_data;
  }

  /**
  Constructs a form at an element.
  @param element Form element on which to create the form.
  @param config Object defining the configuration of the form.
  */
  function Form(element, config)
  {
    var _this = this;
    this.element = element;

    //Render all fields
    if (config.fields !== undefined)
    {
      for (var i = 0; i < config.fields.length; ++i)
      {
        var field = config.fields[i];

        //Generate field label
        if (field.label !== undefined && field.name !== undefined)
        {
          var label = document.createElement('label');
          label.setAttribute('for', field.name);
          label.appendChild(document.createTextNode(field.label));
          element.appendChild(label);
        }

        //Generate field using a generator function
        if (field.type in field_functions.generate && 'name' in field)
        {
          element.appendChild(field_functions.generate[field.type](field));

          //Render field error area
          var field_errors = document.createElement('ul');
          field_errors.setAttribute('class', 'field_errors');
          field_errors.setAttribute('for', field.name);
          field_errors.hidden = true;
          element.appendChild(field_errors);

          element.appendChild(document.createElement('br'));
        }
      }
    }

    //Render non-field error area
    var non_field_errors = document.createElement('ul');
    non_field_errors.setAttribute('class', 'non_field_errors');
    non_field_errors.hidden = true;
    element.appendChild(non_field_errors);

    //Render buttons (submit/clear)
    if (config.buttons !== undefined)
    {
      for (var i = 0; i < config.buttons.length; ++i)
      {
        var button_config = config.buttons[i];
        if (button_config.name === undefined ||
            button_config.value === undefined ||
            !(button_config.type == 'submit' || button_config.type == 'clear'))
          continue;
        var node = document.createElement('input');
        node.setAttribute('type', button_config.type);
        node.setAttribute('name', button_config.name);
        node.setAttribute('value', button_config.value);
        element.appendChild(node);
      }
    }

    //Link submit action to form
    if (config.on_submit !== undefined)
    {
      function onSubmit()
      {
        var post_data = collectPostData(element);
        config.on_submit(post_data, new Form.SubmitEvent(_this));
        return false;
      }
      element.onsubmit = onSubmit;
    }
  }

  return Form;
})();

/**
An object passed to the on_submit function of forms. Allows the function to
communicate with the Form object.
*/
Form.SubmitEvent = (function()
{
  function SubmitEvent(form)
  {
    this.form = form;
    var non_field_errors =
      form.element.getElementsByClassName('non_field_errors');
    for (var i = 0; i < non_field_errors.length; ++i)
    {
      non_field_errors[i].hidden = true;
      for (var j = 0; j < non_field_errors[i].childNodes.length; ++j)
        non_field_errors[i].removeChild(non_field_errors[i].childNodes[j]);
    }
    var field_errors =
      form.element.getElementsByClassName('field_errors');
    for (var i = 0; i < field_errors.length; ++i)
    {
      field_errors[i].hidden = true;
      for (var j = 0; j < field_errors[i].childNodes.length; ++j)
        field_errors[i].removeChild(field_errors[i].childNodes[j]);
    }
  }

  /**
  Displays an error on the form that is not associated with a field.
  @param message Error message to display.
  */
  SubmitEvent.prototype.nonFieldError = function(message)
  {
    var non_field_errors =
      this.form.element.getElementsByClassName('non_field_errors');
    for (var i = 0; i < non_field_errors.length; ++i)
    {
      non_field_errors[i].hidden = false;
      var error_li = document.createElement('li');
      error_li.appendChild(document.createTextNode(message));
      non_field_errors[i].appendChild(error_li);
    }
  };

  /**
  Displays an error on the form that is associated with a field.
  @param field_name Text of name attribute of the field to which this error
    belongs.
  @param message Error message to display.
  */
  SubmitEvent.prototype.fieldError = function(field_name, message)
  {
    var field_errors = this.form.element.querySelectorAll(
      '.field_errors[for=' + field_name + ']');
    for (var i = 0; i < field_errors.length; ++i)
    {
      field_errors[i].hidden = false;
      var error_li = document.createElement('li');
      error_li.appendChild(document.createTextNode(message));
      field_errors[i].appendChild(error_li);
    }
  };

  return SubmitEvent;
})();
