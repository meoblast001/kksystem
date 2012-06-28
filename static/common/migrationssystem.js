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

var MigrationsSystem = (function()
{
	function MigrationsSystem(database, success_callback, error_callback)
	{
		this.database = database;
		database.transaction(function(transaction)
		{
			//Create migration table if it does not already exist
			transaction.executeSql('CREATE TABLE IF NOT EXISTS __migrations__ (migration_id VARCHAR(60));', [], function(transaction, results)
			{
				success_callback();
			},
			function(transaction, results)
			{
				error_callback();
			});
		});
	}

	MigrationsSystem.prototype.MigrateUp = function(success_callback, error_callback)
	{
		var _this = this;
		var migrations_processed = 0;
		var already_failed = false;
		function GenerateMigrationFunction(i)
		{
			return function()
			{
				_this.database.transaction(function(transaction)
				{
					//Has this migration already been applied?
					transaction.executeSql('SELECT * FROM __migrations__ WHERE migration_id = "' + MIGRATIONS[i].id + '";', [], function(transaction, result)
					{
						//If migration was not applied, apply it and record this action in the __migrations__ table
						if (result.rows.length == 0)
						{
							MIGRATIONS[i].migrate(_this.database, function()
							{
								_this.database.transaction(function(transaction)
								{
									transaction.executeSql('INSERT INTO __migrations__ (migration_id) VALUES ("' + MIGRATIONS[i].id + '");', [], function(transaction, results)
									{
										++migrations_processed;
										if (migrations_processed == MIGRATIONS.length)
										{
											//Do not call the success callback if a failure occurred
											if (!already_failed)
												success_callback();
										}
									});
								});
							},
							function(message)
							{
								error_callback('migration', message);
							});
						}
						else
						{
							++migrations_processed;
							if (migrations_processed == MIGRATIONS.length && !already_failed)
								success_callback();
						}
					},
					function(transaction, message)
					{
						if (!already_failed)
							error_callback('local-db', message);
						already_failed = true;
					});
				});
			}
		}
		for (var i = 0; i < MIGRATIONS.length; ++i)
			GenerateMigrationFunction(i)();
	}

	return MigrationsSystem;
})();
