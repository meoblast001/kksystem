# Karteikartensystem

## Developer Setup
- Read CODING_STANDARDS.txt
- Install dependencies
- - Django
- - South
- Configure user_settings.py
- - Copy user_settings.py.example to user_settings.py
- - Configure database and cache (Cache preconfigured to Memcached)
- - Comment out FORCE_SCRIPT_NAME and STATIC_ROOT
- - STATIC_URL should remain as '/static/' (Default)
- - All other configuration options should be straightforward
- Run `python manage.py runserver` to run the test server or
  `python manage.py shell` to drop into the interactive shell
