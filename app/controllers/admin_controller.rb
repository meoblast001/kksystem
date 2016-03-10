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

class AdminController < ApplicationController
  before_action :generate_navlinks

  def statistics
    #Statistics page.
    add_breadcrumb I18n.t('admin.header'), admin_statistics_path
    add_breadcrumb I18n.t('admin.statistics.header'), admin_statistics_path

    @user_weekly_creation = User.weekly_creation_stats(1.years.ago, 0.years.ago)
    @card_daily_creation = Card.daily_creation_stats(1.months.ago, 0.months.ago)
  end

  def users
    #Users page.
    add_breadcrumb I18n.t('admin.header'), admin_statistics_path
    add_breadcrumb I18n.t('admin.users.header'), admin_users_path
  end

  private

  # Private: Method called before action to generate the navigation bar on the
  #   side of every admin page.
  def generate_navlinks
    @admin_navlinks = {
        admin_statistics_path => I18n.t('admin.statistics.header'),
        admin_users_path => I18n.t('admin.users.header'),
      }
  end
end
