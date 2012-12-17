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
  on_submit : function(post_data)
    {
      //Triggered when the form is submitted. Receives an object where keys are
      //field names and values are the field value.
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
      },
      {
        type : 'submit', //Creates a submit button.
        name : 'submit', //Name of submit button.
        value : 'Submit' //Value (text) of button.
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
              r_node.setAttribute('value', value);
              r_node.appendChild(
                document.createTextNode(config.options[value]));
              for (key in config.options[value].attributes)
                r_node.setAttribute(key, config.options[value].attributes[key]);
              node.appendChild(r_node);
            }
            return node;
          },
        submit : function(config)
          {
            if (config.name === undefined || config.value === undefined)
              return null;
            var node = document.createElement('input');
            node.setAttribute('type', 'submit');
            node.setAttribute('name', config.name);
            node.setAttribute('value', config.value);
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
          },
        submit : function(element, value)
          {
            //Cannot set value of submit.
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
      else if (field_node_name == 'select' || field_node_name == 'div')
      {
        for (var j = 0; j < field_node.childNodes.length; ++j)
        {
          var choice_node = field_node.childNode[j];
          var is_option = choice_node.nodeName.toLowerCase() == 'option';
          var is_radio = choice_node.nodeName.toLowerCase() == 'radio' &&
                         choice_node.getAttribute('type').toLowerCase() ==
                         'radio';
          if (choice_node.selected && (is_option || is_radio))
            post_data[field_node.name || field_node.id] = choice_node.value;
        }
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
    if (config.fields !== undefined)
    {
      for (var i = 0; i < config.fields.length; ++i)
      {
        var field = config.fields[i];

        if (field.label !== undefined && field.name !== undefined)
        {
          var label = document.createElement('label');
          label.setAttribute('for', field.name);
          label.appendChild(document.createTextNode(field.label));
          element.appendChild(label);
          element.appendChild(document.createElement('br'));
        }

        if (field.type in field_functions.generate)
        {
          element.appendChild(field_functions.generate[field.type](field));
          element.appendChild(document.createElement('br'));
        }
      }
    }
    if (config.on_submit !== undefined)
    {
      function onSubmit()
      {
        var post_data = collectPostData(element);
        config.on_submit(post_data);
        return false;
      }
      element.onsubmit = onSubmit;
    }
  }

  return Form;
})();
