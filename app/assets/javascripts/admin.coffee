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

namespace 'kksystem.admin.statistics', (ns) ->
  # Public: Initialise admin statistics.
  ns.init = ->
    initUserWeeklyCreationStats()
    initCardDailyCreationStats()

  # Private: Load user weekly registration data and create a bar chart with the
  #   data.
  initUserWeeklyCreationStats = ->
    raw_data = JSON.parse($('#data input[name=user_weekly_creation]').val())
    data =
      labels: (date for date, amount of raw_data)
      datasets: [data: (amount for date, amount of raw_data)]
    options =
      animationSteps: 1

    canvas = $('#user_weekly_creation').get(0)
    chart = new Chart(canvas.getContext('2d')).Bar(data, options)

  # Private: Load card daily creation data and create a bar chart with the data.
  initCardDailyCreationStats = ->
    raw_data = JSON.parse($('#data input[name=card_daily_creation]').val())
    data =
      labels: (date for date, amount of raw_data)
      datasets: [data: (amount for date, amount of raw_data)]
    options =
      animationSteps: 1

    canvas = $('#card_daily_creation').get(0)
    chart = new Chart(canvas.getContext('2d')).Bar(data, options)
