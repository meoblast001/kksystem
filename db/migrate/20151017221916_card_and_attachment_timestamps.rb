class CardAndAttachmentTimestamps < ActiveRecord::Migration
  def change
    change_table :cards do |t|
      t.timestamps
    end

    change_table :card_attachments do |t|
      t.timestamps
    end
  end
end
