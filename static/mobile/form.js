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
Creates a new HTML form, which submits to a Javascript function.
*/
var Form = (function()
{
	/**
	Constructs a new form.
	@param submit_callback Function to call when the form is submitted
	@param id ID to use for the form element.
	@param html_class Class to use for the form element.
	@param submit_button_name Value to use for submit button.
	*/
	function Form(submit_callback, html_class, submit_button_name)
	{
		this.submit_callback = submit_callback;
		this.id = Form.prototype.cur_form_id++;
		this.html_class = html_class;
		this.submit_button_name = submit_button_name;
		this.inputs = [];
		Form.prototype.all_forms[this.id] = this;
	}

	//List of all forms
	Form.prototype.all_forms = {};
	Form.prototype.cur_form_id = 1;

	/**
	Adds a text input field to the form.
	@param name Name of the field.
	@param label Field label.
	@param initial_value Initial value of input. Null if no initial value.
	@param max_length Maximium length of input text.
	*/
	Form.prototype.AddText = function(name, label, initial_value, max_length)
	{
		this.inputs.push({type : 'text', name : name, label : label, attributes : {value : initial_value, maxlength : max_length}});
	};

	/**
	Adds a password text input field to the form.
	@param name Name of the field.
	@param label Field label.
	*/
	Form.prototype.AddPassword = function(name, label)
	{
		this.inputs.push({type : 'password', name : name, label : label, attributes : {}});
	};

	/**
	Adds a select drop-down field to the form.
	@param name Name of the field.
	@param label Field label.
	@param options Menu options. A dictionary of values to names.
	@param initial_value Value of the initially selected menu option.
	*/
	Form.prototype.AddSelect = function(name, label, options, initial_value)
	{
		this.inputs.push({type : 'select', name : name, label : label, options : options, initial_value : initial_value});
	};

	/**
	Adds a group of radio buttons to the form.
	@param name Name of the radio button group.
	@param label Group label.
	@param options Radio buttons. A dictionary of values to names.
	*/
	Form.prototype.AddRadio = function(name, label, options)
	{
		this.inputs.push({type : 'radio', name : name, label : label, options : options});
	};

	/**
	Adds a hidden input to the form.
	@param name Name of the field.
	@param initial_value Initial value of input. Null if no initial value.
	*/
	Form.prototype.AddHidden = function(name, initial_value)
	{
		this.inputs.push({type : 'hidden', name : name, attributes : {value : initial_value}});
	};

	/**
	Creates the form in the document.
	@param base_element JQuery object in which to place the item.
	*/
	Form.prototype.Display = function(base_element)
	{
		var result = '<form id="form_' + this.id + '" action="' + this.submit_location + '"' + (this.html_class !== null ? ' class="' + this.html_class + '"' : '') + '>';
		//Get inputs
		for (i = 0; i < this.inputs.length; ++i)
		{
			var cur_input = this.inputs[i]

			if (cur_input.label !== undefined)
				result += '<label for="id_' + cur_input.name + '">' + cur_input.label + '</label><br />';

			if (cur_input.type == 'text' || cur_input.type == 'password' || cur_input.type == 'hidden')
			{
				result += '<input type="' + cur_input.type + '" name="' + cur_input.name + '" id="id_' + cur_input.name + '"';
				//Get attributes
				for (var cur_attribute in cur_input.attributes)
					if (cur_input.attributes[cur_attribute] !== null)
						result += ' ' + cur_attribute + '="' + cur_input.attributes[cur_attribute] + '"';
				result += ' />';
			}
			else if (cur_input.type == 'select')
			{
				result += '<select name="' + cur_input.name + '" id="id_' + cur_input.name + '">';
				//Get options
				for (var cur_option in cur_input.options)
					result += '<option value="' + cur_option + '"' + (cur_option == cur_input.initial_value ? ' selected="selected"' : '') + '>' + cur_input.options[cur_option] + '</option>';
				result += '</select>';
			}
			else if (cur_input.type == 'radio')
			{
				result += '<div id="id_' + cur_input.name + '">';
				//Get options
				var j = 0;
				for (var cur_option in cur_input.options)
				{
					result += '<label for="id_' + cur_input.name + '_' + j + '">' + '<input type="radio" id="id_' + cur_input.name + '_' + j + '" name="' + cur_input.name + '" value="' + cur_option + '" /> ' + cur_input.options[cur_option] + '</label><br />';
					++j;
				}
				result += '</div>';
			}

			if (cur_input.type != 'hidden')
				result += '<br />';
		}
		result += '<input type="submit" value="' + this.submit_button_name + '" /></form>';
		base_element.append(result)

		//Create submit action
		var form_id = this.id;
		$('#form_' + this.id).submit(function()
		{
			//Collect POST data
			var post_data = {};
			$('#form_' + form_id).find('input:checked, input:text, input:hidden, div input:hidden, input:password, option:selected, textarea').each(function()
			{
				post_data[this.name || this.id || this.parentNode.name || this.parentNode.id] = this.value;
			});

			Form.prototype.all_forms[form_id].submit_callback(post_data);
			return false;
		});
	};

	return Form;
})();
