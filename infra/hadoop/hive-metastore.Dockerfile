FROM apache/hive:4.0.1
ADD --chmod=644 https://jdbc.postgresql.org/download/postgresql-42.7.5.jar /opt/hive/lib/postgresql.jar
