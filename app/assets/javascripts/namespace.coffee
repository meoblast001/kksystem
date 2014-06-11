# Copyright (C) 2014 Braden Walters
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

# Public: Opens, and if necessary creates, a namespace.
#
# ns - The name of the namespace, with period separated parts.
# callback - Function which will be called with the namespace opened. Provided
#   one parameter: the opened namespace.
window.namespace = (ns, callback) ->
  last_part = ns.split('.').reduce (prev_part, current_part_name) ->
      unless prev_part[current_part_name]
        prev_part[current_part_name] = {}
      else
        prev_part[current_part_name]
    , window
  callback(last_part)
