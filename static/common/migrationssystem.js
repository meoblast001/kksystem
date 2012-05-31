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
	function MigrationsSystem(database, callback)
	{
		this.database = database;
		database.transaction(function(transaction)
		{
			//Create migration table if it does not already exist
			transaction.executeSql('CREATE TABLE IF NOT EXISTS __migrations__ (migration_id VARCHAR(60));');
			callback();
		});
	}

	MigrationsSystem.prototype.MigrateUp = function(callback)
	{
		var _this = this;
		this.database.transaction(function(transaction)
		{
			var migrations_processed = 0;
			function GenerateMigrationFunction(i)
			{
				return function()
				{
					//Has this migration already been applied?
					transaction.executeSql('SELECT * FROM __migrations__ WHERE migration_id = "' + MIGRATIONS[i].id + '";', [], function(transaction, result)
					{
						++migrations_processed;
						//If migration was not applied, apply it and record this action in the __migrations__ table
						if (result.rows.length == 0)
						{
							MIGRATIONS[i].migrate(_this.database);
								transaction.executeSql('INSERT INTO __migrations__ (migration_id) VALUES ("' + MIGRATIONS[i].id + '");');
							if (migrations_processed == MIGRATIONS.length)
								callback();
						}
					});
				}
			}
			for (var i = 0; i < MIGRATIONS.length; ++i)
			{
				var migration_function = GenerateMigrationFunction(i);
				migration_function();
			}
		});
	}

	return MigrationsSystem;
})();
