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
Database which communicates with the remote and local database to submit and retrieve data.
*/
var Database = (function()
{
	/**
	Constructs database.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs.
	*/
	function Database(success_callback, error_callback)
	{
		this.is_online = true;
		this.current_user = null;
		if (typeof(openDatabase) == 'function')
		{
			this.websql_db = openDatabase('karteikartensystem', '1.0', 'Karteikartensystem', 200000);
			var migrations_system = new MigrationsSystem(this.websql_db, function()
			{
				migrations_system.MigrateUp(success_callback, error_callback);
			});
		}
	}

	/**
	Makes AJAX POST request.
	@param post_data Object containing data to POST.
	@param success_callback Function to call following the request. Takes zero or one parameters: results or none.
	@param error_callback Function to call following an error. Takes two parameters: the error type (Possible values: 'network' or 'server') and the error message.
	@param has_results If true, callback is called with results.
	*/
	function AJAX(post_data, success_callback, error_callback, has_results)
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
						success_callback(result['result']);
					else
						success_callback();
				}
				else if (result['status'] == 'fail')
					error_callback('server', result['message']);
			},
			error : function(jq_xhr, text_status, error_thrown)
			{
				error_callback('network', text_status);
			},
		});
	}

	/**
	Select rows and return an array of objects containing the row data.
	@param websql_db WebSQL database.
	@param table Name of table to query.
	@param attributes Object of attribute/value pairs for WHERE clause.
	@param success_callback Function to call following the request. Takes one parameters: results.
	@param error_callback Function to call following an error. Takes two parameters: the error type (Possible values: 'local-db') and the error message.
	@param start Index of result that should be the first element.
	@param end Index following result that should be the last element.
	*/
	function WebSQLSelect(websql_db, table, attributes, success_callback, error_callback, start, end)
	{
		//Determine amount of attributes
		var num_attributes = 0;
		for (attribute in attributes)
			++num_attributes;

		var sql = 'SELECT * FROM ' + table + (num_attributes != 0 ? ' WHERE ' : ' ');
		for (attribute in attributes)
		{
			if (typeof(attributes[attribute]) == 'string')
				sql += attribute + '="' + attributes[attribute] + '" AND ';
			else if (typeof(attributes[attribute]) == 'boolean')
				sql += attribute + '=' + (attributes[attribute] ? 1 : 0) + ' AND ';
			else
				sql += attribute + '=' + attributes[attribute] + ' AND ';
		}
		sql = sql.substring(0, sql.length - 5) + (start !== undefined && end !== undefined ? ' LIMIT ' + start + ', ' + end : '') + ';';
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
				success_callback(result);
			},
			function(transaction, error)
			{
				error_callback('local-db', error.message);
			});
		});
	}

	/**
	Update rows.
	@param websql_db WebSQL database.
	@param table Name of table to query.
	@param attributes Object of attribute/value pairs for SET clause.
	@param success_callback Function to call following the request if successful. Takes one parameter: results.
	@param error_callback Function to call following an error. Takes two parameters: the error type (Possible values: 'local-db') and the error message.
	*/
	function WebSQLUpdate(websql_db, table, id, attributes, success_callback, error_callback)
	{
		var sql = 'UPDATE ' + table + ' SET modified=1, ';
		for (attribute in attributes)
		{
			if (typeof(attributes[attribute]) == 'string')
				sql += attribute + '="' + attributes[attribute] + '",';
			else if (typeof(attributes[attribute]) == 'boolean')
				sql += attribute + '=' + (attributes[attribute] ? 1 : 0) + ',';
			else
				sql += attribute + '=' + attributes[attribute] + ',';
		}
		sql = sql.substring(0, sql.length - 1) + ' WHERE id=' + id + ';';
		websql_db.transaction(function(transaction)
		{
			transaction.executeSql(sql, [], function(transaction, results)
			{
				success_callback();
			},
			function(transaction, error)
			{
				error_callback('local-db', error.message);
			});
		});
	}

	/**
	Log a user into the system. This does not perform any networking; Uses only the local database.
	@param username Name of user being logged into the system.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs. Takes two parameters: the error type (Possible values: 'local-db') and the error message.
	*/
	Database.prototype.LoginOnline = function(username, success_callback, error_callback)
	{
		if (typeof(openDatabase) != 'function')
		{
			this.current_user = {id : null, username : username};
			success_callback();
			return;
		}

		var _this = this;
		this.websql_db.transaction(function(transaction)
		{
			transaction.executeSql('SELECT * FROM user WHERE username = "' + username + '";', [], function(transaction, results)
			{
				if (results.rows.length > 0)
				{
					var first_row = results.rows.item(0);
					_this.current_user = {id : first_row['id'], username : first_row['username']};
					_this.is_online = !first_row['is_offline'];
					success_callback();
				}
				else
				{
					transaction.executeSql('INSERT INTO user (username, is_offline) VALUES ("' + username + '", 0);', [], function(transaction, results)
					{
						transaction.executeSql('SELECT MAX(id) FROM user;', [], function(trasnaction, results)
						{
							_this.current_user = {id : results.rows.item(0)['MAX(id)'], username : username};
							_this.is_online = true;
							success_callback();
						},
						function(transaction, error)
						{
							error_callback('local-db', error.message);
						});
					},
					function(transaction, error)
					{
						error_callback('local-db', error.message);
					});
				}
			},
			function(transaction, error)
			{
				error_callback('local-db', error.message);
			});
		});
	}

	/**
	Log an offline user into the system.
	@param id User ID of the user.
	@param success_callback Function to call if successful.
	@param error_callback Function to call if an error occurs. Takes 2 parameters: The type of error (Possible values: 'no-local-db', 'local-db', or 'user-not-found') and the error message.
	*/
	Database.prototype.LoginOffline = function(id, success_callback, error_callback)
	{
		if (typeof(openDatabase) != 'function')
		{
			error_callback('no-local-db', 'No local database');
			return;
		}

		var _this = this;
		this.websql_db.transaction(function(transaction)
		{
			transaction.executeSql('SELECT * FROM user WHERE id = "' + id + '" AND is_offline = 1;', [], function(transaction, results)
			{
				if (results.rows.length > 0)
				{
					var user = results.rows.item(0);
					_this.current_user = {id : user['id'], username : user['username']};
					_this.is_online = false;
					success_callback();
				}
				else
					error_callback('user-not-found', 'User was not found');
			},
			function(transaction, error)
			{
				error_callback('local-db', 'Error querying user.');
			});
		});
	}

	/**
	Toggles network status online or offline.
	@param online True if toggling online; False if toggling offline.
	@param success_callback Function to call if successful. Takes no parameters.
	@param error_callback Function to call if an error occurs. Takes two parameters: the error type (Possible values: 'local-db', 'no-local-db') and the error message.
	*/
	Database.prototype.ToggleNetworkStatus = function(online, success_callback, error_callback)
	{
		if (typeof(openDatabase) != 'function')
		{
			error_callback('no-local-db', 'No local database');
			return;
		}

		var _this = this;
		this.websql_db.transaction(function(transaction)
		{
			transaction.executeSql('UPDATE user SET is_offline = ' + (online ? 0 : 1) + ' WHERE id = ' + _this.current_user.id + ';', [], function(transaction, results)
			{
				_this.is_online = online;
				success_callback();
			},
			function(transaction, error)
			{
				error_callback('local-db', error.message);
			})
		});
	}

	/**
	Get a list of users in the local database with a particular network status.
	@param online True if query should look for online users, false if query should look for offline users.
	@param Function to call if successful.
	@param Function to call if an error occurs. Takes 2 parameters: The error type (Possible values: 'no-local-db' or 'local-db') and the error message.
	*/
	Database.prototype.GetUsersByNetworkStatus = function(online, success_callback, error_callback)
	{
		if (typeof(openDatabase) != 'function')
		{
			error_callback('no-local-db', 'No local database.');
			return;
		}
		WebSQLSelect(this.websql_db, 'user', {is_offline : !online}, success_callback, error_callback);
	}

	/**
	Download all information related to a cardset and store it in the local database.
	@param set_id ID of set to download.
	@param success_callback Function to call if successful.
	@param error_callback Funciton to call if an error occurs. Takes 2 parameters: The error type (Possible values: 'no-local-db', 'local-db', or 'network') and the error message.
	*/
	Database.prototype.CheckOut = function(set_id, success_callback, error_callback)
	{
		if (typeof(openDatabase) != 'function')
		{
			error_callback('no-local-db', 'No local database.');
			return;
		}

		var _this =  this;
		var already_failed = false;
		var num_boxes_processed = 0, num_boxes_to_process = 0;
		var num_cards_processed = 0, num_cards_to_process = 0;

		//Generates a function to insert set data from AJAX into the database
		function GenerateSetTransactionFunction(ajax_data, i)
		{
			return function(success_callback, error_callback)
			{
				_this.websql_db.transaction(function(transaction)
				{
					transaction.executeSql('SELECT COUNT(*) AS count FROM cardset WHERE id = ' + ajax_data[i]['id'] + ';', [], function(transaction, count_results)
					{
						//Insert if does not already exist
						if (count_results.rows.item(0)['count'] == 0)
						{
							transaction.executeSql('INSERT INTO cardset (id, owner, name, modified) VALUES (' + ajax_data[i]['id'] + ', ' + _this.current_user['id'] + ', "' + ajax_data[i]['name'] + '", 0);', [], function(transaction, results)
							{
								if (!already_failed)
									success_callback(i);
							},
							function(transaction, error)
							{
								if (!already_failed)
									error_callback('local-db', error.message);
								already_failed = true;
							});
						}
						//Update if exists
						else
						{
							transaction.executeSql('UPDATE cardset SET name = "' + ajax_data[i]['name'] + '", modified = 0;', [], function(transaction, results)
							{
								if (!already_failed)
									success_callback(i);
							},
							function(transaction, error)
							{
								if (!already_failed)
									error_callback('local-db', error.message);
								already_failed = true;
							});
						}
					},
					function(transaction, error)
					{
						if (!already_failed)
							error_callback('local-db', error.message);
						already_failed = true;
					});
				});
			};
		}

		//Generates a function to insert box data from AJAX into the database
		function GenerateBoxTransactionFunction(ajax_data, i)
		{
			return function()
			{
				_this.websql_db.transaction(function(transaction)
				{
					transaction.executeSql('SELECT COUNT(*) AS count FROM cardbox WHERE id = ' + ajax_data[i]['id'] + ';', [], function(transaction, count_results)
					{
						//Insert if does not already exist
						if (count_results.rows.item(0)['count'] == 0)
						{
							transaction.executeSql('INSERT INTO cardbox (id, owner, name, parent_card_set, review_frequency, last_reviewed, modified) VALUES (' + ajax_data[i]['id'] + ', ' + _this.current_user['id'] + ', "' + ajax_data[i]['name'] + '", ' + ajax_data[i]['parent_card_set'] + ', ' + ajax_data[i]['review_frequency'] + ', "' + ajax_data[i]['last_reviewed'] + '", 0);', [], function(transaction, results)
							{
								++num_boxes_processed;
								if (num_boxes_processed == num_boxes_to_process && num_cards_processed == num_cards_to_process && !already_failed)
									success_callback();
							},
							function(transaction, error)
							{
								if (!already_failed)
									error_callback('local-db', error.message);
								already_failed = true;
							});
						}
						//Update if exists
						else
						{
							transaction.executeSql('UPDATE cardbox SET name = "' + ajax_data[i]['name'] + '", parent_card_set = ' + ajax_data[i]['parent_card_set'] + ', review_frequency = ' + ajax_data[i]['review_frequency'] + ', last_reviewed = "' + ajax_data[i]['last_reviewed'] + '", modified = 0;', [], function(transaction, results)
							{
								++num_boxes_processed;
								if (num_boxes_processed == num_boxes_to_process && num_cards_processed == num_cards_to_process && !already_failed)
									success_callback();
							},
							function(transaction, error)
							{
								if (!already_failed)
									error_callback('local-db', error.message);
								already_failed = true;
							});
						}
					},
					function(transcation, error)
					{
						if (!already_failed)
							error_callback('local-db', error.message);
						already_failed = true;
					});
				});
			};
		}

		//Generates a function to insert card data from AJAX into the database
		function GenerateCardTransactionFunction(ajax_data, i)
		{
			return function()
			{
				_this.websql_db.transaction(function(transaction)
				{
					transaction.executeSql('SELECT COUNT(*) AS count FROM card WHERE id = ' + ajax_data[i]['id'] + ';', [], function(transaction, count_results)
					{
						//Insert if does not already exist
						if (count_results.rows.item(0)['count'] == 0)
						{
							transaction.executeSql('INSERT INTO card (id, owner, front, back, parent_card_set, current_box, modified) VALUES (' + ajax_data[i]['id'] + ', ' + _this.current_user['id'] + ', "' + ajax_data[i]['front'] + '", "' + ajax_data[i]['back'] + '", ' + ajax_data[i]['parent_card_set'] + ', ' + ajax_data[i]['current_box'] + ', 0);', [], function(transaction, results)
							{
								++num_cards_processed;
								if (num_boxes_processed == num_boxes_to_process && num_cards_processed == num_cards_to_process && !already_failed)
									success_callback();
							},
							function(transaction, error)
							{
								if (!already_failed)
									error_callback('local-db', error.message);
								already_failed = true;
							});
						}
						else
						{
							transaction.executeSql('UPDATE card SET front = "' + ajax_data[i]['front'] + '", back = "' + ajax_data[i]['back'] + '", parent_card_set = ' + ajax_data[i]['parent_card_set'] + ', current_box = ' + ajax_data[i]['current_box'] + ', modified = 0;', [], function(transaction, results)
							{
								++num_cards_processed;
								if (num_boxes_processed == num_boxes_to_process && num_cards_processed == num_cards_to_process && !already_failed)
									success_callback();
							},
							function(transaction, error)
							{
								if (!already_failed)
									error_callback('local-db', error.message);
								already_failed = true;
							});
						}
					},
					function(transaction, error)
					{
						if (!already_failed)
							error_callback('local-db', error.message);
						already_failed = true;
					});
				});
			};
		}

		//Check out set
		var set_post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardsets', params : JSON.stringify({id : set_id})};
		AJAX(set_post_data, function(results)
		{
			for (var i = 0; i < results.length; ++i)
			{
				GenerateSetTransactionFunction(results, i)(function(i)
				{
					//Check out boxes
					var box_post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardboxes', params : JSON.stringify({parent_card_set : results[i]['id']})};
					AJAX(box_post_data, function(results)
					{
						num_boxes_to_process = results.length;
						for (var i = 0; i < results.length; ++i)
							GenerateBoxTransactionFunction(results, i)();
					}, null, true);

					//Check out cards
					var card_post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cards', params : JSON.stringify({parent_card_set : results[i]['id']})};
					AJAX(card_post_data, function(results)
					{
						num_cards_to_process = results.length;
						for (var i = 0; i < results.length; ++i)
							GenerateCardTransactionFunction(results, i)();
					},
					function(type, message)
					{
						if (!already_failed)
							error_callback(type, message);
						already_failed = true;
					}, true);
				},
				function(type, message)
				{
					if (!already_failed)
						error_callback(type, message);
					already_failed = true;
				});
			}
		}, error_callback, true);
	}

	/**
	Finds sets in the database with attributes matching the provided attributes.
	@param attributes Object of attribute/value pairs to match.
	@param success_callback Function called with results, if successful. Takes one parameter: results.
	@param error_callback Function called if error occurs. Takes two parameters: the error type (Possible values: 'network', 'server', or 'local-db') and message.
	@param start Index of result that should be the first element.
	@param end Index following result that should be the last element.
	*/
	Database.prototype.GetSets = function(attributes, success_callback, error_callback, start, end)
	{
		if (this.is_online)
		{
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardsets', params : JSON.stringify(attributes), start : start, end : end};
			AJAX(post_data, success_callback, error_callback, true);
		}
		else
		{
			attributes['owner'] = this.current_user['id'];
			WebSQLSelect(this.websql_db, 'cardset', attributes, success_callback, error_callback, start, end);
		}
	}

	/**
	Finds boxes in the database with attributes matching the provided attributes.
	@param attributes Object of attribute/value pairs to match.
	@param success_callback Function called with results, if successful. Takes one parameter: results.
	@param error_callback Function called if error occurs. Takes two parameters: the error type (Possible values: 'network', 'server', or 'local-db') and message.
	@param start Index of result that should be the first element.
	@param end Index following result that should be the last element.
	*/
	Database.prototype.GetBoxes = function(attributes, success_callback, error_callback, start, end)
	{
		if (this.is_online)
		{
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cardboxes', params : JSON.stringify(attributes), start : start, end : end};
			AJAX(post_data, success_callback, error_callback, true);
		}
		else
		{
			attributes['owner'] = this.current_user['id'];
			WebSQLSelect(this.websql_db, 'cardbox', attributes, success_callback, error_callback, start, end);
		}
	}

	/**
	Finds cards in the database with attributes matching the provided attributes.
	@param attributes Object of attribute/value pairs to match.
	@param success_callback Function called with results, if successful. Takes one parameter: results.
	@param error_callback Function called if error occurs. Takes two parameters: the error type (Possible values: 'network', 'server', or 'local-db') and message.
	@param start Index of result that should be the first element.
	@param end Index following result that should be the last element.
	*/
	Database.prototype.GetCards = function(attributes, success_callback, error_callback, start, end)
	{
		if (this.is_online)
		{
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'get-cards', params : JSON.stringify(attributes), start : start, end : end};
			AJAX(post_data, success_callback, error_callback, true);
		}
		else
		{
			attributes['owner'] = this.current_user['id'];
			WebSQLSelect(this.websql_db, 'card', attributes, success_callback, error_callback, start, end);
		}
	}

	/**
	Modifies the attributes of a set in the database.
	@param id Primary key of set to modify.
	@param attributes Object of attribute/value pairs containing the attributes that should be modified.
	@param success_callback Function called following modification, if successful. Takes no parameters.
	@param error_callback Function called if error occurs. Takes two parameters: the error type (Possible values: 'network', 'server', or 'local-db') and message.
	*/
	Database.prototype.ModifySet = function(id, attributes, success_callback, error_callback)
	{
		if (this.is_online)
		{
			attributes['id'] = id;
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'modify-cardset', params : JSON.stringify(attributes)};
			AJAX(post_data, success_callback, error_callback, false);
		}
		else
			WebSQLUpdate(this.websql_db, 'cardset', id, attributes, success_callback, error_callback);
	}

	/**
	Modifies the attributes of a box in the database.
	@param id Primary key of box to modify.
	@param attributes Object of attribute/value pairs containing the attributes that should be modified.
	@param success_callback Function called following modification, if successful. Takes no parameters.
	@param error_callback Function called if error occurs. Takes two parameters: the error type (Possible values: 'network', 'server', or 'local-db') and message.
	*/
	Database.prototype.ModifyBox = function(id, attributes, success_callback, error_callback)
	{
		if (this.is_online)
		{
			attributes['id'] = id;
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'modify-cardbox', params : JSON.stringify(attributes)};
			AJAX(post_data, success_callback, error_callback, false);
		}
		else
			WebSQLUpdate(this.websql_db, 'cardbox', id, attributes, success_callback, error_callback);
	}

	/**
	Modifies the attributes of a card in the database.
	@param id Primary key of card to modify.
	@param attributes Object of attribute/value pairs containing the attributes that should be modified.
	@param success_callback Function called following modification, if successful. Takes no parameters.
	@param error_callback Function called if error occurs. Takes two parameters: the error type (Possible values: 'network', 'server', or 'local-db') and message.
	*/
	Database.prototype.ModifyCard = function(id, attributes, success_callback, error_callback)
	{
		if (this.is_online)
		{
			attributes['id'] = id;
			var post_data = {csrfmiddlewaretoken : CSRF_TOKEN, type : 'modify-card', params : JSON.stringify(attributes)};
			AJAX(post_data, success_callback, error_callback, false);
		}
		else
			WebSQLUpdate(this.websql_db, 'card', id, attributes, success_callback, error_callback);
	}

	return Database;
})();
