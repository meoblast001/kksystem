require 'rails_helper'

describe 'user registration' do
  it 'should let the user register if all forms are correctly filled' do
    visit new_user_registration_path
    find('#user_username').set 'Example 1'
    find('#user_email').set 'Email@example.org'
    find('#user_password').set 'password'
    find('#user_password_confirmation').set 'password'
    find('#new_user input[name=commit]').click

    user = User.where(:username => 'example 1', :email => 'email@example.org').
           first
    correct_password = user.valid_password? 'password' unless user.nil?

    expect(user).not_to be_nil
    expect(correct_password).to be(true)
  end
end
