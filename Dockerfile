FROM php:8.3-apache

# Render provides the port through the PORT environment variable.
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/:80>/:10000>/' /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
COPY . /var/www/html/

EXPOSE 10000

CMD ["apache2-foreground"]
