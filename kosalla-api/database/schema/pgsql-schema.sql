--
-- PostgreSQL database dump
--

\restrict EusZRDy7bCkPtlkDiUl6t8R11hs1LAnd6Ybz76ITSBQYguFQVgUoAHf3BVE2KLf

-- Dumped from database version 14.21
-- Dumped by pg_dump version 14.21

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
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: contract_alert_dismissals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_alert_dismissals (
    id bigint NOT NULL,
    contract_id bigint NOT NULL,
    user_id bigint NOT NULL,
    alert_type character varying(10) NOT NULL,
    dismissed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: contract_alert_dismissals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_alert_dismissals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_alert_dismissals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_alert_dismissals_id_seq OWNED BY public.contract_alert_dismissals.id;


--
-- Name: contract_inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_inventory_items (
    contract_id bigint NOT NULL,
    inventory_item_id bigint NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    notes text
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    contract_number character varying(120) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    reminder_days_before_end smallint DEFAULT '90'::smallint NOT NULL,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contracts_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contracts_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contracts_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contracts_id_seq1 OWNED BY public.contracts.id;


--
-- Name: engineers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.engineers (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    title character varying(100),
    level character varying(30) DEFAULT 'mid'::character varying NOT NULL,
    phone character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: engineers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.engineers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: engineers_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.engineers_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: engineers_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.engineers_id_seq1 OWNED BY public.engineers.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq1 OWNED BY public.failed_jobs.id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id bigint NOT NULL,
    name character varying(150),
    product_type character varying(30),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    organization_id bigint NOT NULL,
    master_product_id bigint
);


--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_items_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_items_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_items_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_items_id_seq1 OWNED BY public.inventory_items.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq1 OWNED BY public.jobs.id;


--
-- Name: kb_announcement_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_announcement_reads (
    id bigint NOT NULL,
    announcement_id bigint NOT NULL,
    user_id bigint NOT NULL,
    dismissed_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: kb_announcement_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kb_announcement_reads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kb_announcement_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kb_announcement_reads_id_seq OWNED BY public.kb_announcement_reads.id;


--
-- Name: kb_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_announcements (
    id bigint NOT NULL,
    scope character varying(20) DEFAULT 'product'::character varying NOT NULL,
    product_id bigint,
    title character varying(255) NOT NULL,
    body_html text NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    starts_at timestamp(0) without time zone,
    ends_at timestamp(0) without time zone,
    reviewed_at timestamp(0) without time zone,
    published_at timestamp(0) without time zone,
    created_by bigint NOT NULL,
    reviewed_by bigint,
    published_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: kb_announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kb_announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kb_announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kb_announcements_id_seq OWNED BY public.kb_announcements.id;


--
-- Name: kb_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_articles (
    id bigint NOT NULL,
    product_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    body_html text NOT NULL,
    applies_to_version character varying(255),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    reviewed_at timestamp(0) without time zone,
    published_at timestamp(0) without time zone,
    created_by bigint NOT NULL,
    reviewed_by bigint,
    published_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    source_user_article_id bigint
);


--
-- Name: kb_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kb_articles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kb_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kb_articles_id_seq OWNED BY public.kb_articles.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    address text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq1 OWNED BY public.locations.id;


--
-- Name: master_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_products (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    product_type character varying(30) DEFAULT 'software'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: master_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_products_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_products_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_products_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.master_products_id_seq1 OWNED BY public.master_products.id;


--
-- Name: master_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_roles (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: master_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_roles_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_roles_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_roles_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.master_roles_id_seq1 OWNED BY public.master_roles.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


--
-- Name: migrations_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq1 OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id bigint NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    contact_email character varying(200),
    phone character varying(50),
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organizations_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizations_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organizations_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organizations_id_seq1 OWNED BY public.organizations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq1 OWNED BY public.permissions.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq1 OWNED BY public.personal_access_tokens.id;


--
-- Name: product_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_types (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    name character varying(120) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: product_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_types_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_types_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_types_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_types_id_seq1 OWNED BY public.product_types.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq1 OWNED BY public.roles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: team_group_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_group_user (
    team_group_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_lead boolean DEFAULT false NOT NULL,
    joined_at timestamp(0) without time zone,
    role character varying(255) DEFAULT 'member'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: team_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_groups (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(30) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: team_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_groups_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_groups_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_groups_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_groups_id_seq1 OWNED BY public.team_groups.id;


--
-- Name: ticket_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_attachments (
    id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    ticket_id bigint,
    uploaded_by bigint,
    original_name character varying(255) NOT NULL,
    path character varying(500) NOT NULL,
    mime_type character varying(150),
    size bigint DEFAULT '0'::bigint NOT NULL,
    ticket_comment_id bigint
);


--
-- Name: ticket_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_attachments_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_attachments_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_attachments_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_attachments_id_seq1 OWNED BY public.ticket_attachments.id;


--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_comments (
    id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    body text NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_comments_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_comments_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_comments_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_comments_id_seq1 OWNED BY public.ticket_comments.id;


--
-- Name: ticket_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_replies (
    id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    body text NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: ticket_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_replies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_replies_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_replies_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_replies_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_replies_id_seq1 OWNED BY public.ticket_replies.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    location_id bigint,
    contract_id bigint,
    created_by bigint NOT NULL,
    assigned_team_group_id bigint,
    assigned_to bigint,
    subject character varying(255) NOT NULL,
    description text,
    status character varying(255) DEFAULT 'open'::character varying NOT NULL,
    priority character varying(255) DEFAULT 'medium'::character varying NOT NULL,
    resolved_at timestamp(0) without time zone,
    closed_at timestamp(0) without time zone,
    last_activity_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    inventory_item_id bigint,
    description_html text,
    category character varying(200),
    tagging_word character varying(100),
    ticket_number character varying(80) NOT NULL,
    action_number character varying(80),
    requested_resolution_date date,
    expected_date date,
    version character varying(100),
    build_no character varying(100),
    patch_no character varying(100),
    module character varying(150),
    error_code character varying(100),
    severity character varying(50),
    project character varying(150),
    customer character varying(150),
    complete_ps boolean,
    schedule_comment character varying(255)
);


--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tickets_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tickets_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tickets_id_seq1 OWNED BY public.tickets.id;


--
-- Name: user_article_reviewer_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_article_reviewer_assignments (
    id bigint NOT NULL,
    organization_id bigint,
    product_id bigint NOT NULL,
    reviewer_user_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: user_article_reviewer_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_article_reviewer_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_article_reviewer_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_article_reviewer_assignments_id_seq OWNED BY public.user_article_reviewer_assignments.id;


--
-- Name: user_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_articles (
    id bigint NOT NULL,
    organization_id bigint,
    product_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    body_html text NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    reviewer_id bigint,
    submitted_at timestamp(0) without time zone,
    reviewed_at timestamp(0) without time zone,
    reviewed_by bigint,
    rejected_at timestamp(0) without time zone,
    rejected_by bigint,
    rejected_reason text,
    published_at timestamp(0) without time zone,
    published_by bigint,
    created_by bigint NOT NULL,
    updated_by bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: user_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_articles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_articles_id_seq OWNED BY public.user_articles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    organization_id bigint,
    location_id bigint,
    master_role_id bigint,
    can_create boolean DEFAULT false NOT NULL,
    can_review boolean DEFAULT false NOT NULL,
    can_publish boolean DEFAULT false NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq1 OWNED BY public.users.id;


--
-- Name: contract_alert_dismissals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_alert_dismissals ALTER COLUMN id SET DEFAULT nextval('public.contract_alert_dismissals_id_seq'::regclass);


--
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq1'::regclass);


--
-- Name: engineers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.engineers ALTER COLUMN id SET DEFAULT nextval('public.engineers_id_seq1'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq1'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq1'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq1'::regclass);


--
-- Name: kb_announcement_reads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcement_reads ALTER COLUMN id SET DEFAULT nextval('public.kb_announcement_reads_id_seq'::regclass);


--
-- Name: kb_announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcements ALTER COLUMN id SET DEFAULT nextval('public.kb_announcements_id_seq'::regclass);


--
-- Name: kb_articles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles ALTER COLUMN id SET DEFAULT nextval('public.kb_articles_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq1'::regclass);


--
-- Name: master_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_products ALTER COLUMN id SET DEFAULT nextval('public.master_products_id_seq1'::regclass);


--
-- Name: master_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_roles ALTER COLUMN id SET DEFAULT nextval('public.master_roles_id_seq1'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq1'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq1'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq1'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq1'::regclass);


--
-- Name: product_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types ALTER COLUMN id SET DEFAULT nextval('public.product_types_id_seq1'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq1'::regclass);


--
-- Name: team_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_groups ALTER COLUMN id SET DEFAULT nextval('public.team_groups_id_seq1'::regclass);


--
-- Name: ticket_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments ALTER COLUMN id SET DEFAULT nextval('public.ticket_attachments_id_seq1'::regclass);


--
-- Name: ticket_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN id SET DEFAULT nextval('public.ticket_comments_id_seq1'::regclass);


--
-- Name: ticket_replies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_replies ALTER COLUMN id SET DEFAULT nextval('public.ticket_replies_id_seq1'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq1'::regclass);


--
-- Name: user_article_reviewer_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_article_reviewer_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_article_reviewer_assignments_id_seq'::regclass);


--
-- Name: user_articles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles ALTER COLUMN id SET DEFAULT nextval('public.user_articles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq1'::regclass);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: contract_alert_dismissals contract_alert_dismissals_contract_id_user_id_alert_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_alert_dismissals
    ADD CONSTRAINT contract_alert_dismissals_contract_id_user_id_alert_type_unique UNIQUE (contract_id, user_id, alert_type);


--
-- Name: contract_alert_dismissals contract_alert_dismissals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_alert_dismissals
    ADD CONSTRAINT contract_alert_dismissals_pkey PRIMARY KEY (id);


--
-- Name: contract_inventory_items contract_inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_inventory_items
    ADD CONSTRAINT contract_inventory_items_pkey PRIMARY KEY (contract_id, inventory_item_id);


--
-- Name: contracts contracts_organization_id_contract_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_organization_id_contract_number_unique UNIQUE (organization_id, contract_number);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: engineers engineers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.engineers
    ADD CONSTRAINT engineers_pkey PRIMARY KEY (id);


--
-- Name: engineers engineers_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.engineers
    ADD CONSTRAINT engineers_user_id_unique UNIQUE (user_id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: inventory_items inventory_items_organization_id_master_product_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_organization_id_master_product_id_unique UNIQUE (organization_id, master_product_id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: kb_announcement_reads kb_announcement_reads_announcement_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcement_reads
    ADD CONSTRAINT kb_announcement_reads_announcement_id_user_id_unique UNIQUE (announcement_id, user_id);


--
-- Name: kb_announcement_reads kb_announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcement_reads
    ADD CONSTRAINT kb_announcement_reads_pkey PRIMARY KEY (id);


--
-- Name: kb_announcements kb_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcements
    ADD CONSTRAINT kb_announcements_pkey PRIMARY KEY (id);


--
-- Name: kb_articles kb_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_pkey PRIMARY KEY (id);


--
-- Name: kb_articles kb_articles_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_slug_unique UNIQUE (slug);


--
-- Name: kb_articles kb_articles_source_user_article_id_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_source_user_article_id_uq UNIQUE (source_user_article_id);


--
-- Name: locations locations_organization_id_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_organization_id_code_unique UNIQUE (organization_id, code);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: master_products master_products_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_products
    ADD CONSTRAINT master_products_name_unique UNIQUE (name);


--
-- Name: master_products master_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_products
    ADD CONSTRAINT master_products_pkey PRIMARY KEY (id);


--
-- Name: master_roles master_roles_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_roles
    ADD CONSTRAINT master_roles_name_unique UNIQUE (name);


--
-- Name: master_roles master_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_roles
    ADD CONSTRAINT master_roles_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (role_id, model_id, model_type);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: product_types product_types_organization_id_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_organization_id_code_unique UNIQUE (organization_id, code);


--
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: team_group_user team_group_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_group_user
    ADD CONSTRAINT team_group_user_pkey PRIMARY KEY (team_group_id, user_id);


--
-- Name: team_groups team_groups_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_groups
    ADD CONSTRAINT team_groups_code_unique UNIQUE (code);


--
-- Name: team_groups team_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_groups
    ADD CONSTRAINT team_groups_pkey PRIMARY KEY (id);


--
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: ticket_replies ticket_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_replies
    ADD CONSTRAINT ticket_replies_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: user_article_reviewer_assignments ua_rev_org_product_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_article_reviewer_assignments
    ADD CONSTRAINT ua_rev_org_product_unique UNIQUE (organization_id, product_id);


--
-- Name: user_article_reviewer_assignments user_article_reviewer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_article_reviewer_assignments
    ADD CONSTRAINT user_article_reviewer_assignments_pkey PRIMARY KEY (id);


--
-- Name: user_articles user_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: contract_alert_dismissals_user_id_alert_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_alert_dismissals_user_id_alert_type_index ON public.contract_alert_dismissals USING btree (user_id, alert_type);


--
-- Name: contract_inventory_items_inventory_item_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_inventory_items_inventory_item_id_index ON public.contract_inventory_items USING btree (inventory_item_id);


--
-- Name: contracts_organization_id_end_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_organization_id_end_date_index ON public.contracts USING btree (organization_id, end_date);


--
-- Name: contracts_status_end_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contracts_status_end_date_index ON public.contracts USING btree (status, end_date);


--
-- Name: engineers_is_active_level_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX engineers_is_active_level_index ON public.engineers USING btree (is_active, level);


--
-- Name: inventory_items_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_items_is_active_index ON public.inventory_items USING btree (is_active);


--
-- Name: inventory_items_organization_id_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_items_organization_id_is_active_index ON public.inventory_items USING btree (organization_id, is_active);


--
-- Name: inventory_items_product_type_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_items_product_type_is_active_index ON public.inventory_items USING btree (product_type, is_active);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: kb_announcement_reads_user_id_dismissed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kb_announcement_reads_user_id_dismissed_at_index ON public.kb_announcement_reads USING btree (user_id, dismissed_at);


--
-- Name: kb_announcements_scope_product_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kb_announcements_scope_product_id_status_index ON public.kb_announcements USING btree (scope, product_id, status);


--
-- Name: kb_announcements_starts_at_ends_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kb_announcements_starts_at_ends_at_index ON public.kb_announcements USING btree (starts_at, ends_at);


--
-- Name: kb_articles_product_id_status_published_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kb_articles_product_id_status_published_at_index ON public.kb_articles USING btree (product_id, status, published_at);


--
-- Name: kb_articles_title_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kb_articles_title_index ON public.kb_articles USING btree (title);


--
-- Name: locations_organization_id_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX locations_organization_id_name_index ON public.locations USING btree (organization_id, name);


--
-- Name: master_products_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX master_products_is_active_index ON public.master_products USING btree (is_active);


--
-- Name: master_products_product_type_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX master_products_product_type_is_active_index ON public.master_products USING btree (product_type, is_active);


--
-- Name: master_roles_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX master_roles_name_index ON public.master_roles USING btree (name);


--
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: organizations_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organizations_is_active_index ON public.organizations USING btree (is_active);


--
-- Name: organizations_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX organizations_name_index ON public.organizations USING btree (name);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: product_types_organization_id_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_types_organization_id_is_active_index ON public.product_types USING btree (organization_id, is_active);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: team_group_user_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_group_user_user_id_index ON public.team_group_user USING btree (user_id);


--
-- Name: team_groups_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_groups_is_active_index ON public.team_groups USING btree (is_active);


--
-- Name: ticket_attachments_ticket_comment_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_attachments_ticket_comment_id_created_at_index ON public.ticket_attachments USING btree (ticket_comment_id, created_at);


--
-- Name: ticket_comments_is_internal_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_comments_is_internal_index ON public.ticket_comments USING btree (is_internal);


--
-- Name: ticket_comments_ticket_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_comments_ticket_id_created_at_index ON public.ticket_comments USING btree (ticket_id, created_at);


--
-- Name: ticket_replies_is_internal_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_replies_is_internal_index ON public.ticket_replies USING btree (is_internal);


--
-- Name: ticket_replies_ticket_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_replies_ticket_id_created_at_index ON public.ticket_replies USING btree (ticket_id, created_at);


--
-- Name: ticket_replies_user_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_replies_user_id_created_at_index ON public.ticket_replies USING btree (user_id, created_at);


--
-- Name: tickets_assigned_team_group_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_assigned_team_group_id_status_index ON public.tickets USING btree (assigned_team_group_id, status);


--
-- Name: tickets_assigned_to_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_assigned_to_status_index ON public.tickets USING btree (assigned_to, status);


--
-- Name: tickets_closed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_closed_at_index ON public.tickets USING btree (closed_at);


--
-- Name: tickets_contract_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_contract_id_index ON public.tickets USING btree (contract_id);


--
-- Name: tickets_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_created_at_index ON public.tickets USING btree (created_at);


--
-- Name: tickets_created_by_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_created_by_index ON public.tickets USING btree (created_by);


--
-- Name: tickets_last_activity_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_last_activity_at_index ON public.tickets USING btree (last_activity_at);


--
-- Name: tickets_organization_id_priority_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_organization_id_priority_index ON public.tickets USING btree (organization_id, priority);


--
-- Name: tickets_organization_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_organization_id_status_index ON public.tickets USING btree (organization_id, status);


--
-- Name: tickets_priority_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_priority_index ON public.tickets USING btree (priority);


--
-- Name: tickets_resolved_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_resolved_at_index ON public.tickets USING btree (resolved_at);


--
-- Name: tickets_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_status_index ON public.tickets USING btree (status);


--
-- Name: user_article_reviewer_assignments_product_id_organization_id_in; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_article_reviewer_assignments_product_id_organization_id_in ON public.user_article_reviewer_assignments USING btree (product_id, organization_id);


--
-- Name: user_articles_organization_id_product_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_articles_organization_id_product_id_status_index ON public.user_articles USING btree (organization_id, product_id, status);


--
-- Name: user_articles_published_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_articles_published_at_index ON public.user_articles USING btree (published_at);


--
-- Name: user_articles_reviewer_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_articles_reviewer_id_status_index ON public.user_articles USING btree (reviewer_id, status);


--
-- Name: users_location_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_location_id_index ON public.users USING btree (location_id);


--
-- Name: users_organization_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_organization_id_index ON public.users USING btree (organization_id);


--
-- Name: contract_alert_dismissals contract_alert_dismissals_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_alert_dismissals
    ADD CONSTRAINT contract_alert_dismissals_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_alert_dismissals contract_alert_dismissals_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_alert_dismissals
    ADD CONSTRAINT contract_alert_dismissals_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contract_inventory_items contract_inventory_items_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_inventory_items
    ADD CONSTRAINT contract_inventory_items_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE CASCADE;


--
-- Name: contract_inventory_items contract_inventory_items_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_inventory_items
    ADD CONSTRAINT contract_inventory_items_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: contracts contracts_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: engineers engineers_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.engineers
    ADD CONSTRAINT engineers_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: inventory_items inventory_items_master_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_master_product_id_foreign FOREIGN KEY (master_product_id) REFERENCES public.master_products(id) ON DELETE SET NULL;


--
-- Name: kb_announcement_reads kb_announcement_reads_announcement_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcement_reads
    ADD CONSTRAINT kb_announcement_reads_announcement_id_foreign FOREIGN KEY (announcement_id) REFERENCES public.kb_announcements(id) ON DELETE CASCADE;


--
-- Name: kb_announcement_reads kb_announcement_reads_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcement_reads
    ADD CONSTRAINT kb_announcement_reads_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: kb_announcements kb_announcements_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcements
    ADD CONSTRAINT kb_announcements_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: kb_announcements kb_announcements_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcements
    ADD CONSTRAINT kb_announcements_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.master_products(id);


--
-- Name: kb_announcements kb_announcements_published_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcements
    ADD CONSTRAINT kb_announcements_published_by_foreign FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- Name: kb_announcements kb_announcements_reviewed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_announcements
    ADD CONSTRAINT kb_announcements_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: kb_articles kb_articles_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: kb_articles kb_articles_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.master_products(id);


--
-- Name: kb_articles kb_articles_published_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_published_by_foreign FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- Name: kb_articles kb_articles_reviewed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: kb_articles kb_articles_source_user_article_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT kb_articles_source_user_article_id_fk FOREIGN KEY (source_user_article_id) REFERENCES public.user_articles(id) ON DELETE SET NULL;


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: product_types product_types_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: team_group_user team_group_user_team_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_group_user
    ADD CONSTRAINT team_group_user_team_group_id_foreign FOREIGN KEY (team_group_id) REFERENCES public.team_groups(id) ON DELETE CASCADE;


--
-- Name: team_group_user team_group_user_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_group_user
    ADD CONSTRAINT team_group_user_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_ticket_comment_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_ticket_comment_id_foreign FOREIGN KEY (ticket_comment_id) REFERENCES public.ticket_comments(id) ON DELETE SET NULL;


--
-- Name: ticket_attachments ticket_attachments_ticket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_ticket_id_foreign FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: ticket_comments ticket_comments_ticket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_id_foreign FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_replies ticket_replies_ticket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_replies
    ADD CONSTRAINT ticket_replies_ticket_id_foreign FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_replies ticket_replies_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_replies
    ADD CONSTRAINT ticket_replies_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_assigned_team_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_team_group_id_foreign FOREIGN KEY (assigned_team_group_id) REFERENCES public.team_groups(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_assigned_to_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_to_foreign FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_contract_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_contract_id_foreign FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_inventory_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_inventory_item_id_foreign FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: tickets tickets_location_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_location_id_foreign FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_article_reviewer_assignments user_article_reviewer_assignments_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_article_reviewer_assignments
    ADD CONSTRAINT user_article_reviewer_assignments_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_article_reviewer_assignments user_article_reviewer_assignments_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_article_reviewer_assignments
    ADD CONSTRAINT user_article_reviewer_assignments_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.master_products(id) ON DELETE CASCADE;


--
-- Name: user_article_reviewer_assignments user_article_reviewer_assignments_reviewer_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_article_reviewer_assignments
    ADD CONSTRAINT user_article_reviewer_assignments_reviewer_user_id_foreign FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_articles user_articles_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_articles user_articles_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: user_articles user_articles_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.master_products(id);


--
-- Name: user_articles user_articles_published_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_published_by_foreign FOREIGN KEY (published_by) REFERENCES public.users(id);


--
-- Name: user_articles user_articles_rejected_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_rejected_by_foreign FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: user_articles user_articles_reviewed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: user_articles user_articles_reviewer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_reviewer_id_foreign FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: user_articles user_articles_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_articles
    ADD CONSTRAINT user_articles_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: users users_location_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_location_id_foreign FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;


--
-- Name: users users_master_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_master_role_id_foreign FOREIGN KEY (master_role_id) REFERENCES public.master_roles(id) ON DELETE SET NULL;


--
-- Name: users users_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict EusZRDy7bCkPtlkDiUl6t8R11hs1LAnd6Ybz76ITSBQYguFQVgUoAHf3BVE2KLf

--
-- PostgreSQL database dump
--

\restrict OIjBPIzs49nfCXHX1xsPzFmJJzQynFEXQa8k5lmGPxg22PUYfPcnNh2siFFm1vQ

-- Dumped from database version 14.21
-- Dumped by pg_dump version 14.21

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

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2025_12_17_000000_create_organizations_table	1
5	2025_12_17_000001_create_locations_table	1
6	2025_12_17_000002_create_contracts_table	1
7	2025_12_17_000003_create_team_groups_table	1
8	2025_12_17_000004_create_tickets_table	1
9	2025_12_17_073218_create_permission_tables	1
10	2025_12_17_073240_create_inventory_items_table	1
11	2025_12_17_073242_add_org_location_to_users_table	1
12	2025_12_17_073242_create_ticket_replies_table	1
13	2025_12_17_073243_create_contract_inventory_table	1
14	2025_12_17_073243_create_team_group_user_table	1
15	2025_12_17_075531_create_personal_access_tokens_table	1
16	2025_12_17_081401_create_ticket_comments_table	1
17	2025_12_19_000000_create_master_roles_table	1
18	2025_12_19_000001_add_master_role_id_to_users_table	1
19	2025_12_23_014936_add_deleted_at_to_organizations_table	1
20	2025_12_29_041155_add_deleted_at_to_locations_table	1
21	2025_12_29_085013_create_product_types_table	1
22	2025_12_29_092124_add_organization_id_to_inventory_items_table	1
23	2025_12_30_052755_add_timestamps_to_team_group_user_table	1
24	2025_12_30_054728_add_details_to_team_group_user_table	1
25	2025_12_30_062917_create_engineers_table	1
26	2026_01_07_093830_create_ticket_attachments_table	1
27	2026_01_08_030122_alter_tickets_add_inventory_and_description_html	1
28	2026_01_08_093101_add_ticket_number_to_tickets	1
29	2026_01_08_093511_add_portal_fields_to_tickets	1
30	2026_01_08_100000_make_contract_and_inventory_nullable_on_tickets	1
31	2026_01_08_101000_make_description_nullable_on_tickets	1
32	2026_01_08_102000_add_ticket_id_to_ticket_attachments	1
33	2026_01_08_103000_add_missing_columns_to_ticket_attachments	1
34	2026_01_09_000000_create_master_products_table	1
35	2026_01_09_000100_alter_inventory_items_add_master_product_id	1
36	2026_01_09_001000_drop_name_unique_on_inventory_items	1
37	2026_01_19_060909_add_ticket_comment_id_to_ticket_attachments_table	1
38	2026_02_12_034811_create_kb_announcements_table	2
39	2026_02_12_034811_create_kb_articles_table	2
40	2026_02_12_034812_create_contract_alert_dismissals_table	2
41	2026_02_12_034812_create_kb_announcement_reads_table	2
42	2026_02_13_075351_create_user_articles_table	2
44	2026_02_13_075352_create_user_article_reviewer_assignments_table	3
45	2026_02_15_153716_add_article_access_columns_to_users_table	3
46	2026_02_18_080944_alter_user_articles_org_id_nullable	3
47	2026_02_19_061053_add_source_user_article_id_to_kb_articles_table	3
48	2026_02_22_120000_add_additional_fields_to_tickets	4
\.


--
-- Name: migrations_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq1', 48, true);


--
-- PostgreSQL database dump complete
--

\unrestrict OIjBPIzs49nfCXHX1xsPzFmJJzQynFEXQa8k5lmGPxg22PUYfPcnNh2siFFm1vQ

