# Copyright (C) 2015 Braden Walters
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

namespace :admin do
  desc "Upgrades a user to admin status if the user exists."
  task :make_admin, [:username] => :environment do |t, args|
    username = args[:username]
    if username.nil? or username.empty?
      puts "No username provided. Please provide one argument: the name of " +
           "the user to be given admin status."
      exit
    end

    user = User.where(:username => username).first
    unless user.nil?
      user.is_admin = true
      unless user.save
        puts "Failed to save user."
        exit
      end
    else
      puts "The specified user \"#{username}\" does not exist."
      exit
    end
  end
end
