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

var Database = (function()
{
	function Database(is_online)
	{
		this.is_online = is_online;
	}

	/**
	Makes AJAX POST request.
	@param post_data Object containing data to POST.
	@param callback Function to call following the request. Takes one or two parameters: results and callback_params or only callback_params.
	@param callback_params Parameters to pass to callback function.
	@param has_results If true, callback is called with results.
	*/
	function AJAX(post_data, callback, callback_params, has_results)
	{
		$.ajax({
			type : 'POST',
			url : SITE_ROOT + '/ajax/',
			data : post_data,
			dataType : 'json',
			success : function(result)
			{
				if (result['status'] == 'success')
				{
					if (has_results)
						callback(result['result'], callback_params);
					else
						callback(callback_params);
				}
				else if (result['status'] == 'fail')
					alert(result['message']);
			},
			error : function(jq_xhr, text_status, error_thrown)
			{
				alert('An error has occurred: ' + text_status);
			},
		});
	}

	/**
	Finds sets in the database with attributes matching the provided attributes.
	@param attributes Object of attribute/value pairs to match.
	@param callback Function to call with results. Takes two parameters: results and callback_params.
	@param callback_params Parameters to pass to callback function.
	*/
	Database.prototype.GetSets = function(attributes, callback, callback_params)
	{
		if (this.is_online)
		{
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardsets', params : JSON.stringify(attributes)};
			AJAX(post_data, callback, callback_params, true);
		}
	}

	/**
	Finds boxes in the database with attributes matching the provided attributes.
	@param attributes Object of attribute/value pairs to match.
	@param callback Function to call with results. Takes two parameters: results and callback_params.
	@param callback_params Parameters to pass to callback function.
	*/
	Database.prototype.GetBoxes = function(attributes, callback, callback_params)
	{
		if (this.is_online)
		{
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardboxes', params : JSON.stringify(attributes)};
			AJAX(post_data, callback, callback_params, true);
		}
	}

	/**
	Finds cards in the database with attributes matching the provided attributes.
	@param attributes Object of attribute/value pairs to match.
	@param callback Function to call with results. Takes two parameters: results and callback_params.
	@param callback_params Parameters to pass to callback function.
	*/
	Database.prototype.GetCards = function(attributes, callback, callback_params)
	{
		if (this.is_online)
		{
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cards', params : JSON.stringify(attributes)};
			AJAX(post_data, callback, callback_params, true);
		}
	}

	/**
	Modifies the attributes of a box in the database.
	@param id Primary key of box to modify.
	@param attributes Object of attribute/value pairs containing the attributes that should be modified.
	@param callback Function to call following modification. Takes one parameter: callback_params.
	@param_params Parameters to pass to callback function.
	*/
	Database.prototype.ModifyBox = function(id, attributes, callback, callback_params)
	{
		if (this.is_online)
		{
			attributes['id'] = id;
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'modify-cardbox', params : JSON.stringify(attributes)};
			AJAX(post_data, callback, callback_params, false);
		}
	}

	/**
	Modifies the attributes of a card in the database.
	@param id Primary key of card to modify.
	@param attributes Object of attribute/value pairs containing the attributes that should be modified.
	@param callback Function to call following modification. Takes one parameter: callback_params.
	@param_params Parameters to pass to callback function.
	*/
	Database.prototype.ModifyCard = function(id, attributes, callback, callback_params)
	{
		if (this.is_online)
		{
			attributes['id'] = id;
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'modify-card', params : JSON.stringify(attributes)};
			AJAX(post_data, callback, callback_params, false);
		}
	}

	return Database;
})();
