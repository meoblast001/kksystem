# KKSystem

## Developer Setup
- Read STYLE_GUIDE.md
- Install dependencies
  - Run `bundle`
- Configure config/user_settings.rb
  - Copy config/user_settings.example.rb to config/user_settings.rb
  - Configure database in config/database.yml from config/database.example.yml
    - Migrate with `rake db:migrate`
- Run `rails server` to run the test server or `rails console` to drop into the
  interactive shell
