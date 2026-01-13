--
-- PostgreSQL database dump
--

\restrict bLyCdVihV6QORXeN0LpYFhuuknqEYMbtYSRfNUoG5KxS8lkg5lpUBOz47Mn5jws

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg12+1)
-- Dumped by pg_dump version 17.7 (Debian 17.7-3.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
DROP INDEX IF EXISTS public.idx_sessions_user_id;
DROP INDEX IF EXISTS public.idx_sessions_token;
DROP INDEX IF EXISTS public.idx_sessions_expires;
DROP INDEX IF EXISTS public.idx_notes_user_id;
DROP INDEX IF EXISTS public.idx_notes_updated;
DROP INDEX IF EXISTS public.idx_notes_tags;
DROP INDEX IF EXISTS public.idx_notes_status;
DROP INDEX IF EXISTS public.idx_notes_embedding;
DROP INDEX IF EXISTS public.idx_notes_created;
DROP INDEX IF EXISTS public.idx_documents_user_id;
DROP INDEX IF EXISTS public.idx_documents_status;
DROP INDEX IF EXISTS public.idx_documents_mime;
DROP INDEX IF EXISTS public.idx_documents_embedding;
DROP INDEX IF EXISTS public.idx_documents_created;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_token_key;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.notes DROP CONSTRAINT IF EXISTS notes_pkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.documents;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP EXTENSION IF EXISTS vector;
--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
			BEGIN
				NEW.updated_at = NOW();
				RETURN NEW;
			END;
			$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    filename character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size bigint NOT NULL,
    storage_path text NOT NULL,
    thumbnail_path text,
    metadata jsonb DEFAULT '{}'::jsonb,
    full_text text,
    tags text[] DEFAULT '{}'::text[],
    status character varying(20) DEFAULT 'processing'::character varying,
    embedding public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['processing'::character varying, 'ready'::character varying, 'error'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    summary text,
    status character varying(20) DEFAULT 'draft'::character varying,
    tags text[] DEFAULT '{}'::text[],
    language character varying(5) DEFAULT 'de'::character varying,
    word_count integer DEFAULT 0,
    reading_time integer DEFAULT 0,
    difficulty numeric(3,2),
    location jsonb,
    embedding public.vector(1536),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notes_language_check CHECK (((language)::text = ANY ((ARRAY['de'::character varying, 'en'::character varying, 'fr'::character varying, 'es'::character varying, 'it'::character varying, 'mu'::character varying])::text[]))),
    CONSTRAINT notes_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    user_agent text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(100),
    avatar_url text,
    role character varying(20) DEFAULT 'user'::character varying,
    subscription_tier character varying(20) DEFAULT 'free'::character varying,
    language character varying(5) DEFAULT 'de'::character varying,
    theme character varying(10) DEFAULT 'auto'::character varying,
    email_verified boolean DEFAULT false,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    subscription_expires_at timestamp with time zone,
    CONSTRAINT users_language_check CHECK (((language)::text = ANY ((ARRAY['de'::character varying, 'en'::character varying, 'fr'::character varying, 'es'::character varying, 'it'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'superadmin'::character varying])::text[]))),
    CONSTRAINT users_subscription_tier_check CHECK (((subscription_tier)::text = ANY ((ARRAY['free'::character varying, 'pro'::character varying, 'team'::character varying, 'enterprise'::character varying, 'lifetime'::character varying])::text[]))),
    CONSTRAINT users_theme_check CHECK (((theme)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'auto'::character varying])::text[])))
);


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, user_id, title, filename, mime_type, size, storage_path, thumbnail_path, metadata, full_text, tags, status, embedding, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, user_id, title, content, summary, status, tags, language, word_count, reading_time, difficulty, location, embedding, created_at, updated_at) FROM stdin;
0395ecd5-0483-435f-b56b-04b4adea3df0	660abf11-d556-4c6f-8c22-d2e79a1f054a	Unbenannt	{"time": 1768258542895, "blocks": [{"id": "hXaZb7HNwm", "data": {"text": "dsjfdsfksdfj"}, "type": "paragraph"}, {"id": "3Y7ISBkp7g", "data": {"text": "Hallo", "caption": "", "alignment": "left"}, "type": "quote"}, {"id": "3PQ3LXtpJ2", "data": {"text": "fasdfsfdsfs"}, "type": "paragraph"}], "version": "2.31.1"}	\N	draft	{}	de	3	1	\N	\N	\N	2026-01-12 22:55:42.970339+00	2026-01-12 22:55:42.970339+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token, expires_at, user_agent, ip_address, created_at) FROM stdin;
5db4d33d-53e6-435a-861b-57a12e047e04	660abf11-d556-4c6f-8c22-d2e79a1f054a	ddc39d797dffddeec15caa0bd373c9ee39dd645678e507b75cefb8fad8d25ebb	2026-02-11 00:19:13.993+00	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	2026-01-12 00:19:13.994952+00
906a3fd3-f269-47f6-aeb3-f795ffeae7bc	660abf11-d556-4c6f-8c22-d2e79a1f054a	e3c357537fb5bcff0f6adfff0a80decbc6a92b0d64415f6ddfb16f01de5f7d91	2026-02-12 12:20:39.384+00	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	2026-01-13 12:20:39.385469+00
e6108ebf-c697-4db2-97a5-3f3cc8d0842a	660abf11-d556-4c6f-8c22-d2e79a1f054a	bfcc69bd796ea3d146d37cba00d2f15e41ebe103086d91a20b428f3b66388168	2026-02-12 12:23:24.483+00	Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	2026-01-13 12:23:24.484263+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password_hash, display_name, avatar_url, role, subscription_tier, language, theme, email_verified, settings, created_at, updated_at, subscription_expires_at) FROM stdin;
660abf11-d556-4c6f-8c22-d2e79a1f054a	alexander@pokorny.me	alexander	257fcf8e3c3579c52abef7bca223c2b6:53a2eecb5bdccb078a6b32ebbdf54f5c1b3d8b04b1570ef4bdd10616fe5740e5028c7d3c0c0ebf0a8d75fae2f0fc13ed42053c0ff6210c270d2ecc6435e23e4d	Alexander	\N	superadmin	lifetime	de	auto	f	{}	2026-01-12 00:17:06.72241+00	2026-01-12 00:18:08.292399+00	\N
\.


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_documents_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_created ON public.documents USING btree (created_at DESC);


--
-- Name: idx_documents_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_embedding ON public.documents USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='64');


--
-- Name: idx_documents_mime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_mime ON public.documents USING btree (mime_type);


--
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- Name: idx_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_user_id ON public.documents USING btree (user_id);


--
-- Name: idx_notes_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_created ON public.notes USING btree (created_at DESC);


--
-- Name: idx_notes_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_embedding ON public.notes USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='64');


--
-- Name: idx_notes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_status ON public.notes USING btree (status);


--
-- Name: idx_notes_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_tags ON public.notes USING gin (tags);


--
-- Name: idx_notes_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_updated ON public.notes USING btree (updated_at DESC);


--
-- Name: idx_notes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);


--
-- Name: idx_sessions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notes update_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notes notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict bLyCdVihV6QORXeN0LpYFhuuknqEYMbtYSRfNUoG5KxS8lkg5lpUBOz47Mn5jws

