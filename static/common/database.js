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
	function Database()
	{
		this.is_online = true;
		if (typeof(openDatabase) == 'function')
		{
			this.websql_db = openDatabase('karteikartensystem', '1.0', 'Karteikartensystem', 200000);
			var migrations_system = new MigrationsSystem(this.websql_db, function()
			{
				migrations_system.MigrateUp(function() { /*Do nothing*/ });
			});
		}
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
	Select rows and return an array of objects containing the row data.
	@param websql_db WebSQL database.
	@param table Name of table to query.
	@param attributes Object of attribute/value pairs for WHERE clause.
	@param callback Function to call following the request. Takes two parameters: results and callback_params.
	@param callback_params Parameters to pass to callback function.
	*/
	function WebSQLSelect(websql_db, table, attributes, callback, callback_params)
	{
		//Determine amount of attributes
		var num_attributes = 0;
		for (attribute in attributes)
			++num_attributes;

		var sql = 'SELECT * FROM ' + table + (num_attributes != 0 ? ' WHERE ' : ' ');
		for (attribute in attributes)
			sql += attribute + '=' + attributes[attribute] + ',';
		sql = sql.substring(0, sql.length - 1) + ';';
		websql_db.transaction(function(transaction)
		{
			transaction.executeSql(sql, [], function(transaction, sql_result)
			{
				var result = [];
				for (var i = 0; i < sql_result.rows.length; ++i)
				{
					var row = sql_result.rows.item(i);
					var object = {};
					for (attribute in row)
						object[attribute] = row[attribute];
					result.push(object);
				}
				callback(result, callback_params);
			});
		});
	}

	/**
	Update rows.
	@param websql_db WebSQL database.
	@param table Name of table to query.
	@param attributes Object of attribute/value pairs for SET clause.
	@param callback Function to call following the request. Takes two parameters: results and callback_params.
	@param callback_params Parameters to pass to callback function.
	*/
	function WebSQLUpdate(websql_db, table, id, attributes, callback, callback_params)
	{
		var sql = 'UPDATE ' + table + ' SET modified=1 ';
		for (attribute in attributes)
			sql += attribute + '=' + attributes[attribute] + ',';
		sql = sql.substring(0, sql.length - 1) + ' WHERE id=' + id + ';';
		websql_db.transaction(function(transaction)
		{
			transaction.executeSql(sql);
			callback(callback_params);
		});
	}

	/**
	Download all information related to a cardset and store it in the local database.
	@param set_id ID of set to download.
	@param callback Function to call when complete.
	*/
	Database.prototype.CheckOut = function(set_id, callback)
	{
		if (typeof(openDatabase) != 'function')
			return;

		var _this =  this;
		var num_boxes_processed = 0, num_boxes_to_process = 0;
		var num_cards_processed = 0, num_cards_to_process = 0;

		//Check out set
		var set_post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardsets', params : JSON.stringify({id : set_id})};
		AJAX(set_post_data, function(results, callback_params)
		{
			function GenerateSetTransactionFunction(i)
			{
				return function()
				{
					_this.websql_db.transaction(function(transaction)
					{
						transaction.executeSql('INSERT INTO cardset (id, name, modified) VALUES (' + results[i]['id'] + ', "' + results[i]['name'] + '", 0);');
					});
				}
			}
			for (var i = 0; i < results.length; ++i)
			{
				var set_transaction_function = GenerateSetTransactionFunction(i);
				set_transaction_function();

				//Check out boxes
				var box_post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardboxes', params : JSON.stringify({parent_card_set : results[i]['id']})};
				AJAX(box_post_data, function(results, callback_params)
				{
					num_boxes_to_process = results.length;
					function GenerateBoxTransactionFunction(i)
					{
						return function()
						{
							_this.websql_db.transaction(function(transaction)
							{
								transaction.executeSql('INSERT INTO cardbox (id, name, parent_card_set, review_frequency, last_reviewed, modified) VALUES (' + results[i]['id'] + ', "' + results[i]['name'] + '", ' + results[i]['parent_card_set'] + ', ' + results[i]['review_frequency'] + ', "' + results[i]['last_reviewed'] + '", 0);', [], function(transaction, results)
								{
									++num_boxes_processed;
									if (num_boxes_processed == num_boxes_to_process && num_cards_processed == num_cards_to_process)
										callback();
								});
							});
						}
					}
					for (var i = 0; i < results.length; ++i)
					{
						var box_transaction_function = GenerateBoxTransactionFunction(i);
						box_transaction_function();
					}
				}, null, true);

				//Check out cards
				var card_post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cards', params : JSON.stringify({parent_card_set : results[i]['id']})};
				AJAX(card_post_data, function(results, callback_params)
				{
					num_cards_to_process = results.length;
					function GenerateCardTransactionFunction(i)
					{
						return function()
						{
							_this.websql_db.transaction(function(transaction)
							{
								transaction.executeSql('INSERT INTO card (id, front, back, parent_card_set, current_box, modified) VALUES (' + results[i]['id'] + ', "' + results[i]['front'] + '", "' + results[i]['back'] + '", ' + results[i]['parent_card_set'] + ', ' + results[i]['current_box'] + ', 0);', [], function(transaction, results)
								{
									++num_cards_processed;
									if (num_boxes_processed == num_boxes_to_process && num_cards_processed == num_cards_to_process)
										callback();
								});
							});
						}
					}
					for (var i = 0; i < results.length; ++i)
					{
						var card_transaction_function = GenerateCardTransactionFunction(i);
						card_transaction_function(i);
					}
				}, null, true);
			}
		}, null, true);
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
		else
			WebSQLSelect(this.websql_db, 'cardset', attributes, callback, callback_params);
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
		else
			WebSQLSelect(this.websql_db, 'cardbox', attributes, callback, callback_params);
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
		else
			WebSQLSelect(this.websql_db, 'card', attributes, callback, callback_params);
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
		else
			WebSQLUpdate(this.websql_db, 'cardbox', id, attributes, callback, callback_params);
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
