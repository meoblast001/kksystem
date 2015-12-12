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

class SiteController < ApplicationController
  def index
    render :landing, :layout => false unless signed_in?
  end

  # Public: Render privacy policy out of configuration.
  def privacy_policy
    policy_dir = Rails.root.join('config', 'privacy_policy')
    if File.exists? policy_dir.join("#{I18n.locale}.md")
      policy_file = open policy_dir.join("#{I18n.locale}.md")
    else
      policy_file = open policy_dir.join('default.md')
    end
    @policy_html = Kramdown::Document.new(policy_file.read).to_html
  end
end
