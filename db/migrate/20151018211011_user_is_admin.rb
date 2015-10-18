class UserIsAdmin < ActiveRecord::Migration
  def change
    change_table :users do |t|
      t.boolean :is_admin, :null => false, :default => false
    end
  end
end
