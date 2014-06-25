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

# Public: Server-side module for client model described in models.coffee under
#   assets.
module ClientModel
  # Public: Process parameters sent by client model.
  #
  # klass - ActiveRecord subclass affected by this operation.
  # params - Parameters hash as provided to the controller by Rails.
  # current_user - The model of the currently logged in user.
  #
  # Returns results of operation.
  def self.process(klass, params, current_user)
    case params[:operation]
      #Load models from criteria.
      when 'load'
        query = current_user.send(klass.name.underscore.pluralize)

        #Convert client criteria to ActiveRecord criteria.
        params[:conditions].each do |condition|
          attribute = condition.last[:attribute]
          operator = condition.last[:operator]
          value = condition.last[:value]

          case operator
            when 'eq'
              query = query.where(attribute => value)
            when 'gt'
              query = query.where { send(klass.table_name).send(attribute) >
                                    value }
            when 'lt'
              query = query.where { send(klass.table_name).send(attribute) <
                                    value }
            else
              return { :success => false }
          end
        end

        #For each record returned, collect the ID and the attributes that will
        #be sent back to the client and store them in a hash.
        records = query.map do |record|
          (klass::CLIENT_MODEL_ATTRIBUTES + [:id]).inject(Hash.new) do
              |result, attr|
            result[attr] = record.send(attr)
            result
          end
        end

        return {
            :success => true,
            :records => records,
          }

      #Modify model's attributes.
      when 'save'
        #New attribute if no ID provided, else existing.
        if params[:attributes][:id].nil?
          record = klass.new
        else
          record = klass.where(:id => params[:attributes][:id]).first
        end

        #Only update attributes which are not the ID and are listed as a client
        #model attribute in the ActiveRecord subclass.
        update_hash = params[:attributes].inject(Hash.new) do
            |result, (key, value)|
          if (key != 'id' and
              klass::CLIENT_MODEL_ATTRIBUTES.include?(key.to_sym))
            result[key] = value
          end
          result
        end
        record.update_attributes(update_hash)
        success = record.save

        return {
            :success => success,
            #Send updated attributes.
            :attributes => (klass::CLIENT_MODEL_ATTRIBUTES + [:id]).inject(
                  Hash.new) do |result, attr|
                result[attr] = record.send(attr)
                result
              end
          }
    end
  end
end
