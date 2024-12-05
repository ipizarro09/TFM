-- Table: respuestas

-- DROP TABLE respuestas;

CREATE TABLE respuestas
(
  id serial NOT NULL,
  n_dimensiones character varying(50),
  tipo_datos character varying(100),
  ordenadas character varying(50) DEFAULT 'Not applicable'::character varying,
  n_grupos_alto character varying(100) DEFAULT 'Not applicable'::character varying,
  relacion character varying(100) DEFAULT 'Not applicable'::character varying,
  obs_grupo character varying(50) DEFAULT 'Not applicable'::character varying,
  proposito character varying(100),
  dataset_size character varying(50),
  contexto character varying(100),
  CONSTRAINT respuestas_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE respuestas
  OWNER TO postgres;
GRANT ALL ON TABLE respuestas TO postgres;
GRANT ALL ON TABLE respuestas TO ipizarro;
