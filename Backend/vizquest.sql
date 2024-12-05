-- Database: vizquest

-- DROP DATABASE vizquest;

CREATE DATABASE vizquest
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       TABLESPACE = pg_default
       LC_COLLATE = 'Spanish_Spain.1252'
       LC_CTYPE = 'Spanish_Spain.1252'
       CONNECTION LIMIT = -1;
GRANT CONNECT, TEMPORARY ON DATABASE vizquest TO public;
GRANT ALL ON DATABASE vizquest TO postgres;
GRANT ALL ON DATABASE vizquest TO ipizarro;

