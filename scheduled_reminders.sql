--
-- PostgreSQL database dump
--

\restrict S0hoBTGh5wggrF4Vr5z3ETpvhWmc2rvtfJByH9bEkHgbsqAqc6JQK3kMMgeHASm

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: scheduled_reminders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduled_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reminder_type text DEFAULT 'general'::text NOT NULL,
    email_to text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    send_at timestamp with time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone,
    sent boolean DEFAULT false,
    failed boolean DEFAULT false,
    failed_at timestamp with time zone,
    failure_reason text
);


ALTER TABLE public.scheduled_reminders OWNER TO postgres;

--
-- Name: scheduled_reminders scheduled_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_pkey PRIMARY KEY (id);


--
-- Name: idx_scheduled_reminders_due; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scheduled_reminders_due ON public.scheduled_reminders USING btree (send_at) WHERE (status = 'pending'::text);


--
-- Name: idx_scheduled_reminders_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scheduled_reminders_type ON public.scheduled_reminders USING btree (reminder_type);


--
-- Name: TABLE scheduled_reminders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.scheduled_reminders TO cpmsoft_user;


--
-- PostgreSQL database dump complete
--

\unrestrict S0hoBTGh5wggrF4Vr5z3ETpvhWmc2rvtfJByH9bEkHgbsqAqc6JQK3kMMgeHASm

