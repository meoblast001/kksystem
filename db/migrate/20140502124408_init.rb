class Init < ActiveRecord::Migration
  def up
    create_table :users do |t|
      t.string :username
      t.string :email
      t.string :unconfirmed_email

      t.string :encrypted_password
      t.boolean :must_reset_password

      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      t.string   :confirmation_token
      t.datetime :confirmed_at
      t.datetime :confirmation_sent_at

      t.timestamps
    end

    add_index :users, :username, :unique => true
    add_index :users, :email, :unique => true
    add_index :users, :reset_password_token, :unique => true
    add_index :users, :confirmation_token, :unique => true

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
