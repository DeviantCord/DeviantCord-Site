---
sidebar_position: 1
---
# System Requirements
DeviantCord is a multi-application Discord bot that requires a few different services to run. Below is a list of the requirements for each service.
- Java 11+
- Python 3.10
- Postgres (15+ recommended)
- Redis/Valkey (6+)
- RabbitMQ (3.12+)

## Postgres
Postgres is required to run the Postgres database that the bot uses to store its data. Most Linux distributions have a Postgres package available by default. If not already installed, you can install it using your package manager. For example, on Debian-based systems, you can install it using:
```bash
sudo apt update
sudo apt install postgresql
```

On RHEL-based systems such as CentOS, Fedora, AlmaLinux, Rocky Linux, and others, you can install it using:
```bash
sudo dnf update
sudo dnf install postgresql
```

You will then need to create a new database and user that the bot can use. It is recommended to create a new user specifically for the bot. 

You can do this by using the default user to interactively create a new user and database:
```bash
sudo -u postgres createuser deviantcord --pwprompt
```

You can then create a new database for the bot using the new user:


```sql
CREATE DATABASE deviantcord;
CREATE USER deviantcord WITH PASSWORD 'deviantcord';
GRANT ALL PRIVILEGES ON DATABASE deviantcord TO deviantcord;
```

## Redis/Valkey
Redis or Valkey is required to run the Redis database that the bot uses to store its data. Most Linux distributions have a Redis package available by default. If not already installed, you can install it using your package manager. For example, on Debian-based systems, you can install it using:
```bash
sudo apt update
sudo apt install redis
```

On RHEL-based systems such as CentOS, Fedora, AlmaLinux, Rocky Linux, and others, you can install it using:
```bash
sudo dnf update
sudo dnf install redis
```

You will then need to configure Redis to allow the bot to use it. Open the Redis configuration file, which is typically located at `/etc/redis.conf`, and set the following parameters to set a password for the Redis server:
```
requirepass CHANGETHISPASSWORD
```
### RabbitMQ
RabbitMQ is required to run the RabbitMQ server that the bot uses to handle tasks asynchronously. Most Linux distributions have a RabbitMQ package available by default. If not already installed, you can install it using your package manager. For example, on Debian-based systems, you can install it using:
```bash
sudo apt update
sudo apt install rabbitmq-server
```

On RHEL-based systems such as CentOS, Fedora, AlmaLinux, Rocky Linux, and others, you can install it using:
```bash
sudo dnf update
sudo dnf install rabbitmq-server
```



You will then need to restart the Redis server for the changes to take effect:
```bash
sudo systemctl restart redis
```
## Java
Java is required to run the Discord Bot using JavaCord. Most Linux distributions have a Java Runtime Environment installed by default. If not, you can install it using your package manager. For example, on Debian-based systems, you can install it using:
```bash
sudo apt update
sudo apt install openjdk-17-jre
```

