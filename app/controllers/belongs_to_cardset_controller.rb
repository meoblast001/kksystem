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
  INDEX_ITEM_LIMIT = 50

  def index
    @cardset_id = params[:cardset_id]
    all_entities = current_user.send(entity_type.name.underscore.pluralize).
                   where(:cardset_id => @cardset_id)
    all_entities = all_entities.search(params[:search]) if params[:search]
    @entities = all_entities.offset(params[:offset] || 0).
                limit(INDEX_ITEM_LIMIT)

    #Determine previous and next offsets.
    offset = params[:offset].to_i
    prev_off = if offset - INDEX_ITEM_LIMIT > 0 then offset - INDEX_ITEM_LIMIT
               elsif offset > 0 then 0 else nil end
    next_off = if offset + INDEX_ITEM_LIMIT < all_entities.count
               then offset + INDEX_ITEM_LIMIT else nil end
    @prev = { :offset => prev_off }
    @next = { :offset => next_off }
    if params[:search]
      @prev[:search] = @next[:search] = params[:search]
    end

    @cardset = current_user.cardsets.where(:id => params[:cardset_id]).first
    entity_breadcrumbs
  end

  def new
    @entity = entity_type.new(:cardset_id => params[:cardset_id])
    @cardset = current_user.cardsets.where(:id => params[:cardset_id]).first
    entity_breadcrumbs
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
          @cardset = current_user.cardsets.where(:id => params[:cardset_id]).
                     first
          entity_breadcrumbs
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
    @cardset = @entity.cardset
    entity_breadcrumbs
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
      @cardset = @entity.cardset
      entity_breadcrumbs
      render :form
    end
  end

  def destroy
    @entity = current_user.send(entity_type.name.underscore.pluralize).
              where(:id  => params[:id]).first
    @entity.destroy unless @entity.nil?
    redirect_to :action => :index, :cardset_id => @entity.cardset_id
  end

  protected

  # Protected: Abstract. Define in child controller as entity class.
  def entity_type
    raise NotImplementedError
  end
end
