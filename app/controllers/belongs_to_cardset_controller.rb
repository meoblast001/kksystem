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

class BelongsToCardsetController < ApplicationController
  def index
    @entities = current_user.send(entity_type.name.underscore.pluralize).
                where(:cardset_id => params[:cardset_id])

    @entities = @entities.search(params[:search]) if params[:search]
  end

  def new
    @entity = entity_type.new(:cardset_id => params[:cardset_id])
    render :form
  end

  def create
    @entity = entity_type.new(allowed_params)
    @entity.user_id = current_user.id
    #TODO: Handle case where cardset_id is not provided.
    @entity.cardset_id = params[entity_type.name.underscore][:cardset_id]
    saved = @entity.save

    respond_to do |format|
      format.html do
        if saved
          flash[:notice] = I18n.t(entity_type.name.underscore.pluralize +
                                  '.new.success_notice')
          flash[:type] = :success
          redirect_to :action => :new, :cardset_id => @entity.cardset_id
        else
          render :form
        end
      end

      format.json do
        if saved
          render :json => { :success => true }
        else
          render :json => { :success => false, :errors => @entity.errors }
        end
      end
    end
  end

  #When HTML, shows entity and also allows the user to edit that entity.
  def show
    @entity = current_user.send(entity_type.name.underscore.pluralize).
              where(:id => params[:id]).first
    render :form
  end

  def update
    @entity = current_user.send(entity_type.name.underscore.pluralize).
              where(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @entity.nil?
    @entity.update_attributes(allowed_params)

    if @entity.save
      redirect_to :action => :index, :cardset_id => @entity.cardset_id
    else
      render :form
    end
  end

  protected

  # Protected: Abstract. Define in child controller as entity class.
  def entity_type
    raise NotImplementedError
  end
end