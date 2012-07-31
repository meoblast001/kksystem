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
Manages local WebSQL database.
*/
var LocalDatabaseWebSQL = (function()
{
	function LocalDatabaseWebSQL(database_name, verison, database_longname, size, success_callback, error_callback)
	{
		if (typeof(openDatabase) == 'function')
		{
			this.websql_db = openDatabase(database_name, '1.0', database_longname, size);
			var migrations_system = new MigrationsSystemWebSQL(this.websql_db, function()
			{
				migrations_system.MigrateUp(success_callback, error_callback);
			});
		}
		else
			error_callback('not-supported', 'WebSQL not available');
	}

	/**
	Select rows and return an array of objects containing the row data.
	@param table Name of table to query.
	@param attributes Object of attribute/value pairs to search.
	@param start Index of result that should be the first element.
	@param end Index following result that should be the last element.
	@param success_callback Function to call following the request. Takes one parameters: results.
	@param error_callback Function to call following an error. Takes two parameters: the error type (Possible values: 'local-db') and the error message.
	*/
	LocalDatabaseWebSQL.prototype.Select = function(table, attributes, start, end, success_callback, error_callback)
	{
		//Determine amount of attributes
		var num_attributes = 0;
		for (attribute in attributes)
			++num_attributes;

		var sql = 'SELECT * FROM ' + table + (num_attributes != 0 ? ' WHERE ' : ' ');
		for (attribute in attributes)
		{
			if (attributes[attribute] === undefined)
				continue;
			if (attributes[attribute] === null)
			{
				sql += attribute + ' IS NULL AND ';
				continue;
			}
			if (SCHEMA_WEBSQL[table][attribute] == 'string')
				sql += attribute + '="' + attributes[attribute] + '" AND ';
			else if (SCHEMA_WEBSQL[table][attribute] == 'boolean')
				sql += attribute + '=' + (attributes[attribute] ? 1 : 0) + ' AND ';
			else if (SCHEMA_WEBSQL[table][attribute] == 'datetime')
				sql += attribute + '=' + Math.round(attributes[attribute].getTime() / 1000) + ' AND ';
			else
				sql += attribute + '=' + attributes[attribute] + ' AND ';
		}
		sql = sql.substring(0, num_attributes > 0 ? sql.length - 5 : sql.length) + (start !== null && end !== null ? ' LIMIT ' + start + ', ' + end : '') + ';';

		this.websql_db.transaction(function(transaction)
		{
			transaction.executeSql(sql, [], function(transaction, sql_result)
			{
				var result = [];
				for (var i = 0; i < sql_result.rows.length; ++i)
				{
					var row = sql_result.rows.item(i);
					var object = {};
					for (attribute in row)
					{
						if (SCHEMA_WEBSQL[table][attribute] == 'datetime')
							object[attribute] = new Date(row[attribute] * 1000);
						else
							object[attribute] = row[attribute];
					}
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
	@param table Name of table to query.
	@param id ID of item to update.
	@param attributes Object of attribute/value pairs to modify.
	@param success_callback Function to call following the request if successful.
	@param error_callback Function to call following an error. Takes two parameters: the error type (Possible values: 'local-db') and the error message.
	*/
	LocalDatabaseWebSQL.prototype.Update = function(table, id, attributes, success_callback, error_callback)
	{
		this.websql_db.transaction(function(transaction)
		{
			var sql = 'UPDATE ' + table + ' SET ';
			for (attribute in attributes)
			{
				if (attributes[attribute] === undefined)
					continue;
				if (SCHEMA_WEBSQL[table][attribute] == 'string')
					sql += attribute + '="' + attributes[attribute] + '",';
				else if (SCHEMA_WEBSQL[table][attribute] == 'boolean')
					sql += attribute + '=' + (attributes[attribute] ? 1 : 0) + ',';
				else if (SCHEMA_WEBSQL[table][attribute] == 'datetime')
					sql += attribute + '=' + Math.round(attributes[attribute].getTime() / 1000) + ',';
				else
					sql += attribute + '=' + attributes[attribute] + ',';
			}
			sql = sql.substring(0, sql.length - 1) + ' WHERE id = ' + id + ';';

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
	Update rows.
	@param table Name of table to query.
	@param attributes Object of attribute/value pairs to modify.
	@param success_callback Function to call following the request if successful. Takes one parameter: the ID of the inserted item.
	@param error_callback Function to call following an error. Takes two parameters: the error type (Possible values: 'local-db', 'no-attributes') and the error message.
	*/
	LocalDatabaseWebSQL.prototype.Insert = function(table, attributes, success_callback, error_callback)
	{
		this.websql_db.transaction(function(transaction)
		{
			//Determine amount of attributes
			var num_attributes = 0;
			for (attribute in attributes)
				++num_attributes;

			if (num_attributes == 0)
				error_callback('no-attributes', 'No attributes');

			var fields = '';
			var values = '';
			for (attribute in attributes)
			{
				if (attributes[attribute] === undefined)
					continue;
				fields += attribute + ',';
				if (SCHEMA_WEBSQL[table][attribute] == 'string')
					values += '"' + attributes[attribute] + '",';
				else if (SCHEMA_WEBSQL[table][attribute] == 'boolean')
					values += (attributes[attribute] ? 1 : 0) + ',';
				else if (SCHEMA_WEBSQL[table][attribute] == 'datetime')
					values += Math.round(attributes[attribute].getTime() / 1000) + ',';
				else
					values += attributes[attribute] + ',';
			}
			sql = 'INSERT INTO ' + table + ' (' + fields.substr(0, fields.length - 1) + ') VALUES (' + values.substr(0, values.length - 1) + ');';

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
	Finds the max value of a particular field in a table.
	@param table Table on which to search.
	@param field Field on which to search.
	@param success_callback Function to call if successful. Takes 1 parameter: The max value.
	@param error_calllback Function to call if an error occurs. Takes 2 parameters: The error type (Possible values: 'local-db') and the error message.
	*/
	LocalDatabaseWebSQL.prototype.Max = function(table, field, success_callback, error_callback)
	{
		this.websql_db.transaction(function(transaction)
		{
			transaction.executeSql('SELECT MAX(' + field + ') AS max FROM ' + table + ';', [], function(transaction, results)
			{
				success_callback(results.rows.item(0)['max']);
			},
			function(transaction, error)
			{
				error_callback('local-db', error.message);
			});
		});
	}

	/**
	Counts the amount of rows that meet a specific criteria.
	@param table Name of table on which to search.
	@param attributes Object of attribute/value pairs to use as criteria.
	@param success_callback Function to call if successful. Takes 1 parameter: Count of rows.
	@param error_callback Function to call if an error occurs. Takes 2 parameters: The error type (Possible values: 'local-db') and the error message.
	*/
	LocalDatabaseWebSQL.prototype.Count = function(table, attributes, success_callback, error_callback)
	{
		var where = '';
		for (attribute in attributes)
		{
			if (attributes[attribute] === undefined)
				continue;
			if (attributes[attribute] === null)
			{
				where += attribute + ' IS NULL AND ';
				continue;
			}
			if (SCHEMA_WEBSQL[table][attribute] == 'string')
				where += attribute + '="' + attributes[attribute] + '" AND ';
			else if (SCHEMA_WEBSQL[table][attribute] == 'boolean')
				where += attribute + '=' + (attributes[attribute] ? 1 : 0) + ' AND ';
			else if (SCHEMA_WEBSQL[table][attribute] == 'datetime')
				where += attribute + '=' + Math.round(attributes[attribute].getTime() / 1000) + ' AND ';
			else
				where += attribute + '=' + attributes[attribute] + ' AND ';
		}

		this.websql_db.transaction(function(transaction)
		{
			transaction.executeSql('SELECT COUNT(*) AS count FROM ' + table + (where != '' ? ' WHERE ' + where.substr(0, where.length - 5) : '') + ';', [], function(transaction, results)
			{
				success_callback(results.rows.item(0)['count']);
			},
			function(transaction, error)
			{
				error_callback('local-db', error.message);
			});
		});
	}

	return LocalDatabaseWebSQL;
})();
