--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = geotop, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: rasters; Type: TABLE; Schema: geotop; Owner: postgres; Tablespace: 
--

CREATE TABLE rasters (
    id integer NOT NULL,
    rast public.raster,
    kaartblad character varying,
    z double precision
);


ALTER TABLE geotop.rasters OWNER TO postgres;

--
-- Name: rasters_id_seq; Type: SEQUENCE; Schema: geotop; Owner: postgres
--

CREATE SEQUENCE rasters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE geotop.rasters_id_seq OWNER TO postgres;

--
-- Name: rasters_id_seq; Type: SEQUENCE OWNED BY; Schema: geotop; Owner: postgres
--

ALTER SEQUENCE rasters_id_seq OWNED BY rasters.id;


--
-- Name: id; Type: DEFAULT; Schema: geotop; Owner: postgres
--

ALTER TABLE ONLY rasters ALTER COLUMN id SET DEFAULT nextval('rasters_id_seq'::regclass);


--
-- Name: rasters_pkey; Type: CONSTRAINT; Schema: geotop; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY rasters
    ADD CONSTRAINT rasters_pkey PRIMARY KEY (id);


--
-- Name: geotop_rasters_kaartblad_idx; Type: INDEX; Schema: geotop; Owner: postgres; Tablespace: 
--

CREATE INDEX geotop_rasters_kaartblad_idx ON rasters USING btree (kaartblad);


--
-- Name: geotop_rasters_rast_idx; Type: INDEX; Schema: geotop; Owner: postgres; Tablespace: 
--

CREATE INDEX geotop_rasters_rast_idx ON rasters USING gist (public.st_convexhull(rast));


--
-- Name: geotop_rasters_z_idx; Type: INDEX; Schema: geotop; Owner: postgres; Tablespace: 
--

CREATE INDEX geotop_rasters_z_idx ON rasters USING btree (z);


--
-- PostgreSQL database dump complete
--

