class CreateCardAttachments < ActiveRecord::Migration
  def change
    create_table :card_attachments do |t|
      t.integer :card_id
      t.string :side, :limit => 5
      t.string :file

      t.foreign_key :cards, :dependent => :delete
    end
  end
end
