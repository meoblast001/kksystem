#!/usr/bin/env python -c

# Copyright (C) 2011 Braden Walters

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

import os

directory = 'karteikarten/migrations/'
all_files = os.listdir(directory)

#Find .py files
py_files = []
for filename in all_files:
  if filename[-3:] == '.py':
    py_files.append(filename)

for filename in py_files:
  #Replace every 4 spaces in original with tabs
  file = open(directory + filename, 'r')
  modified_lines = []
  file_changed = False
  for line in file:
    modified_line = line.replace('    ', '\t')
    modified_lines.append(modified_line)
    if modified_line != line:
      file_changed = True
  file.close()

  if file_changed:
    #Write modifications
    file = open(directory + filename, 'w')
    for line in modified_lines:
      file.write(line)
    file.close()
