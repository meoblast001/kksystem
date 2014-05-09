class Init < ActiveRecord::Migration
  def up
    create_table :users do |t|
      t.string :username
      t.string :email

      t.string :encrypted_password
      t.boolean :must_reset_password

      t.timestamps
    end

    create_table :cardsets do |t|
      t.integer :user_id

      t.string :name

      t.boolean :reintroduce_cards
      t.integer :reintroduce_cards_amount
      t.integer :reintroduce_cards_frequency
      t.timestamp :last_reintroduced_cards

      t.timestamps

      t.foreign_key :users, :dependent => :delete
    end

    create_table :cardboxes do |t|
      t.integer :user_id
      t.integer :cardset_id

      t.string :name

      t.integer :review_frequency
      t.timestamp :last_reviewed

      t.foreign_key :users, :dependent => :delete
      t.foreign_key :cardsets, :dependent => :delete
    end

    create_table :cards do |t|
      t.integer :user_id
      t.integer :cardset_id
      t.integer :current_cardbox_id

      t.text :front
      t.text :back

      t.timestamp

      t.foreign_key :users, :dependent => :delete
      t.foreign_key :cardsets, :dependent => :delete
      t.foreign_key :cardboxes, :dependenet => :nullify,
                    :column => :current_cardbox_id
    end
  end
end
