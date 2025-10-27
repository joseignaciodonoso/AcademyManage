--
-- PostgreSQL database dump
--

\restrict VkdZVmqzKJJG6Nlme6Pnux3IxPoYlpK26H7OqXB2Qwe0qYE0FJ2l6eeGk04gQyO

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.14

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED'
);


--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'PAYMENT',
    'ENROLLMENT'
);


--
-- Name: ChannelVisibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChannelVisibility" AS ENUM (
    'PUBLIC',
    'STUDENTS',
    'COACHES'
);


--
-- Name: ClassStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ClassStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELED'
);


--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentType" AS ENUM (
    'VIDEO',
    'DOCUMENT',
    'IMAGE',
    'AUDIO'
);


--
-- Name: ContentVisibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentVisibility" AS ENUM (
    'PUBLIC',
    'PLAN_RESTRICTED',
    'LEVEL_RESTRICTED',
    'PRIVATE'
);


--
-- Name: EnrollmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EnrollmentStatus" AS ENUM (
    'ENROLLED',
    'WAITLIST',
    'CANCELED'
);


--
-- Name: EventType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EventType" AS ENUM (
    'CHAMPIONSHIP',
    'SEMINAR',
    'HOLIDAY',
    'ANNOUNCEMENT',
    'OTHER'
);


--
-- Name: MembershipStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MembershipStatus" AS ENUM (
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'EXPIRED',
    'TRIAL'
);


--
-- Name: OrganizationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrganizationType" AS ENUM (
    'ACADEMY',
    'CLUB',
    'OTHER'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'TRANSFER'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'PAID',
    'FAILED',
    'CANCELED',
    'REFUNDED'
);


--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentType" AS ENUM (
    'SUBSCRIPTION',
    'INVOICE',
    'SETUP_FEE'
);


--
-- Name: PlanStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PlanStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED'
);


--
-- Name: PlanType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PlanType" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'YEARLY',
    'UNLIMITED'
);


--
-- Name: SportType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SportType" AS ENUM (
    'FOOTBALL',
    'BASKETBALL'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPER_ADMIN',
    'ACADEMY_ADMIN',
    'COACH',
    'STUDENT',
    'FINANCE'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


--
-- Name: Weekday; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Weekday" AS ENUM (
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: academies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academies (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "odooUrl" text,
    "odooDb" text,
    "odooClientId" text,
    "brandPrimary" text DEFAULT '#000000'::text NOT NULL,
    "brandSecondary" text DEFAULT '#666666'::text NOT NULL,
    "brandAccent" text DEFAULT '#0066cc'::text NOT NULL,
    "brandNeutral" text DEFAULT '#f5f5f5'::text NOT NULL,
    "brandBackground" text DEFAULT '#ffffff'::text NOT NULL,
    "brandForeground" text DEFAULT '#000000'::text NOT NULL,
    "logoUrl" text,
    "logoDarkUrl" text,
    "faviconUrl" text,
    "ogImageUrl" text,
    "defaultThemeMode" text DEFAULT 'system'::text NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    timezone text DEFAULT 'America/Santiago'::text NOT NULL,
    "dateFormat" text DEFAULT 'DD/MM/YYYY'::text NOT NULL,
    "taxRate" double precision DEFAULT 0.19 NOT NULL,
    "useUf" boolean DEFAULT false NOT NULL,
    "onboardingCompleted" boolean DEFAULT false NOT NULL,
    discipline text,
    sport public."SportType",
    type public."OrganizationType" DEFAULT 'ACADEMY'::public."OrganizationType" NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id text NOT NULL,
    "academyId" text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    audience text NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "assessorId" text NOT NULL,
    title text NOT NULL,
    notes text,
    score double precision,
    "maxScore" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "currentLevel" text,
    "newLevel" text,
    passed boolean DEFAULT false NOT NULL
);


--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id text NOT NULL,
    "classId" text NOT NULL,
    "userId" text NOT NULL,
    status public."AttendanceStatus" DEFAULT 'PRESENT'::public."AttendanceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "checkedInAt" timestamp(3) without time zone,
    notes text
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "userId" text,
    action public."AuditAction" NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    icon text NOT NULL,
    description text NOT NULL,
    "ruleJson" text NOT NULL
);


--
-- Name: branch_coaches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_coaches (
    "branchId" text NOT NULL,
    "coachId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id text NOT NULL,
    "academyId" text NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    phone text,
    email text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "mondayOpen" text,
    "mondayClose" text,
    "tuesdayOpen" text,
    "tuesdayClose" text,
    "wednesdayOpen" text,
    "wednesdayClose" text,
    "thursdayOpen" text,
    "thursdayClose" text,
    "fridayOpen" text,
    "fridayClose" text,
    "saturdayOpen" text,
    "saturdayClose" text,
    "sundayOpen" text,
    "sundayClose" text
);


--
-- Name: channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channels (
    id text NOT NULL,
    "academyId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    visibility public."ChannelVisibility" DEFAULT 'PUBLIC'::public."ChannelVisibility" NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: class_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_schedules (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "branchId" text NOT NULL,
    "coachId" text NOT NULL,
    title text NOT NULL,
    description text,
    discipline text NOT NULL,
    level text NOT NULL,
    weekday public."Weekday" NOT NULL,
    "startTimeLocal" text NOT NULL,
    "endTimeLocal" text NOT NULL,
    timezone text DEFAULT 'America/Santiago'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "branchId" text NOT NULL,
    "coachId" text NOT NULL,
    title text NOT NULL,
    description text,
    discipline text NOT NULL,
    level text NOT NULL,
    status public."ClassStatus" DEFAULT 'SCHEDULED'::public."ClassStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "maxCapacity" integer DEFAULT 20 NOT NULL,
    "scheduleId" text
);


--
-- Name: club_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.club_expenses (
    id text NOT NULL,
    "academyId" text NOT NULL,
    concept text NOT NULL,
    category text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "receiptUrl" text,
    "receiptName" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: content_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_permissions (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "coachId" text NOT NULL,
    "canVideo" boolean DEFAULT false NOT NULL,
    "canAnnouncement" boolean DEFAULT false NOT NULL,
    "canDoc" boolean DEFAULT false NOT NULL,
    "canLink" boolean DEFAULT false NOT NULL,
    "requireApproval" boolean DEFAULT true NOT NULL,
    "monthlyQuota" integer,
    "maxUploadMB" integer
);


--
-- Name: contents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contents (
    id text NOT NULL,
    "academyId" text NOT NULL,
    title text NOT NULL,
    description text,
    type public."ContentType" NOT NULL,
    visibility public."ContentVisibility" DEFAULT 'PLAN_RESTRICTED'::public."ContentVisibility" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "fileUrl" text NOT NULL,
    "thumbnailUrl" text,
    duration integer,
    "fileSize" integer,
    "requiredPlans" text[],
    "requiredLevel" text,
    "muxAssetId" text,
    "muxPlaybackId" text,
    "channelId" text
);


--
-- Name: curricula; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.curricula (
    id text NOT NULL,
    "academyId" text NOT NULL,
    name text NOT NULL,
    description text,
    discipline text NOT NULL,
    level text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id text NOT NULL,
    "classId" text NOT NULL,
    "userId" text NOT NULL,
    "branchId" text NOT NULL,
    status public."EnrollmentStatus" DEFAULT 'ENROLLED'::public."EnrollmentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "eventId" text NOT NULL,
    "userId" text NOT NULL,
    status public."EnrollmentStatus" DEFAULT 'ENROLLED'::public."EnrollmentStatus" NOT NULL,
    "paidRequired" boolean DEFAULT false NOT NULL,
    "checkedInAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "branchId" text,
    title text NOT NULL,
    description text,
    type public."EventType" DEFAULT 'OTHER'::public."EventType" NOT NULL,
    "allDay" boolean DEFAULT true NOT NULL,
    "eventDate" timestamp(3) without time zone NOT NULL,
    "startAt" timestamp(3) without time zone,
    "endAt" timestamp(3) without time zone,
    published boolean DEFAULT true NOT NULL,
    important boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "orgId" text
);


--
-- Name: kpis_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpis_cache (
    id text NOT NULL,
    "academyId" text NOT NULL,
    metric text NOT NULL,
    value double precision NOT NULL,
    period text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: match_callup_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_callup_players (
    id text NOT NULL,
    "callupId" text NOT NULL,
    "playerId" text NOT NULL,
    type text NOT NULL,
    confirmed boolean DEFAULT false NOT NULL
);


--
-- Name: match_callups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_callups (
    id text NOT NULL,
    "matchId" text NOT NULL,
    formation text,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: match_player_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.match_player_stats (
    id text NOT NULL,
    "matchId" text NOT NULL,
    "playerId" text NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    yellow integer DEFAULT 0 NOT NULL,
    red integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    rebounds integer DEFAULT 0 NOT NULL,
    steals integer DEFAULT 0 NOT NULL,
    blocks integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL,
    minutes integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id text NOT NULL,
    "academyId" text NOT NULL,
    sport public."SportType" NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    opponent text NOT NULL,
    location text NOT NULL,
    "homeAway" text,
    "goalsFor" integer,
    "goalsAgainst" integer,
    "pointsFor" integer,
    "pointsAgainst" integer,
    result text,
    status text DEFAULT 'SCHEDULED'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tournamentId" text
);


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memberships (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    status public."MembershipStatus" DEFAULT 'TRIAL'::public."MembershipStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "trialEndDate" timestamp(3) without time zone,
    "nextBillingDate" timestamp(3) without time zone,
    "odooSubscriptionId" integer
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id text NOT NULL,
    "curriculumId" text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_members (
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    role public."UserRole" DEFAULT 'STUDENT'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: organization_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_settings (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    timezone text DEFAULT 'America/Santiago'::text NOT NULL,
    "taxRate" double precision DEFAULT 0.19 NOT NULL,
    "themeMode" text DEFAULT 'system'::text NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type public."OrganizationType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "membershipId" text,
    amount double precision NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    type public."PaymentType" DEFAULT 'SUBSCRIPTION'::public."PaymentType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "odooTransactionId" text,
    "odooMoveId" integer,
    "odooSubscriptionId" integer,
    "externalRef" text,
    "acquirerCode" text,
    "paidAt" timestamp(3) without time zone,
    "failureReason" text,
    method public."PaymentMethod",
    "eventId" text,
    "userId" text
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id text NOT NULL,
    "academyId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type public."PlanType" NOT NULL,
    status public."PlanStatus" DEFAULT 'ACTIVE'::public."PlanStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    price double precision NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    "trialDays" integer DEFAULT 0 NOT NULL,
    "setupFee" double precision DEFAULT 0 NOT NULL,
    "classesPerMonth" integer,
    "unlimitedClasses" boolean DEFAULT false NOT NULL,
    "accessToContent" boolean DEFAULT true NOT NULL,
    "personalTraining" boolean DEFAULT false NOT NULL,
    "competitionAccess" boolean DEFAULT false NOT NULL,
    "odooProductId" integer,
    "odooSubscriptionTemplateId" integer
);


--
-- Name: player_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_documents (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileName" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "verifiedBy" text,
    "verifiedAt" timestamp(3) without time zone,
    notes text
);


--
-- Name: player_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_evaluations (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "coachId" text NOT NULL,
    "matchId" text,
    "trainingId" text,
    technique integer NOT NULL,
    tactics integer NOT NULL,
    physical integer NOT NULL,
    attitude integer NOT NULL,
    strengths text,
    improvements text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: player_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_goals (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    metric text,
    target double precision,
    "dueDate" timestamp(3) without time zone,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: player_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "position" text NOT NULL,
    "shirtSize" text NOT NULL,
    "preferredNumber" integer,
    "isMinor" boolean DEFAULT false NOT NULL,
    "guardianId" text,
    "totalGoals" integer DEFAULT 0 NOT NULL,
    "totalAssists" integer DEFAULT 0 NOT NULL,
    "totalPoints" integer DEFAULT 0 NOT NULL,
    "totalRebounds" integer DEFAULT 0 NOT NULL,
    "totalSteals" integer DEFAULT 0 NOT NULL,
    "totalBlocks" integer DEFAULT 0 NOT NULL,
    "yellowCards" integer DEFAULT 0 NOT NULL,
    "redCards" integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL,
    "matchesPlayed" integer DEFAULT 0 NOT NULL,
    "minutesPlayed" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: student_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_progress (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "techniqueId" text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    score double precision,
    notes text,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: techniques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.techniques (
    id text NOT NULL,
    "unitId" text NOT NULL,
    name text NOT NULL,
    description text,
    "videoUrl" text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    prerequisites text[],
    tags text[]
);


--
-- Name: tournament_standings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournament_standings (
    id text NOT NULL,
    "tournamentId" text NOT NULL,
    "teamName" text NOT NULL,
    played integer DEFAULT 0 NOT NULL,
    won integer DEFAULT 0 NOT NULL,
    drawn integer DEFAULT 0 NOT NULL,
    lost integer DEFAULT 0 NOT NULL,
    "goalsFor" integer DEFAULT 0 NOT NULL,
    "goalsAgainst" integer DEFAULT 0 NOT NULL,
    "goalDiff" integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    "position" integer
);


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tournaments (
    id text NOT NULL,
    "academyId" text NOT NULL,
    name text NOT NULL,
    description text,
    season text NOT NULL,
    type text DEFAULT 'LEAGUE'::text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    rules text,
    "rulesFileUrl" text,
    "logoUrl" text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: training_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_attendance (
    id text NOT NULL,
    "sessionId" text,
    "playerId" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "checkedInAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "confirmedAt" timestamp(3) without time zone,
    "instanceId" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: training_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_instances (
    id text NOT NULL,
    "scheduleId" text,
    "academyId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    location text NOT NULL,
    type text,
    category text,
    status text DEFAULT 'SCHEDULED'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: training_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_schedules (
    id text NOT NULL,
    "academyId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    location text NOT NULL,
    type text,
    category text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: training_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_sessions (
    id text NOT NULL,
    "academyId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" text,
    "endTime" text,
    duration integer NOT NULL,
    location text,
    focus text,
    notes text,
    status text DEFAULT 'SCHEDULED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id text NOT NULL,
    "moduleId" text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id text NOT NULL,
    "userId" text NOT NULL,
    "badgeId" text NOT NULL,
    "awardedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    "academyId" text,
    email text NOT NULL,
    name text,
    phone text,
    password text,
    role public."UserRole" DEFAULT 'STUDENT'::public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "beltLevel" text,
    discipline text,
    "emergencyContact" text,
    "medicalNotes" text,
    "odooPartnerId" integer,
    "orgId" text
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d63dbf25-1f3e-4796-95a7-e1c6886f7f81', 'd3fe9a85ab1c9875ad0612b955386e3fa06caef7b5dd5d2fbd8260915ac098a3', '2025-10-20 20:43:46.90463+00', '20250929034122_content_admin_models', NULL, NULL, '2025-10-20 20:43:46.719001+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('057baeca-8b0c-434c-8313-dad088df607a', 'b338012d2059c8ae17cab8f74e6395bcdb231940ff4ce551d52737b0ac3f30b5', '2025-10-20 20:43:46.914196+00', '20251001050139_add_payment_method', NULL, NULL, '2025-10-20 20:43:46.906075+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('25dc8251-e28d-4dc4-a811-f44ef7d9e872', 'c6423d59910f79e0bfa25779560c6e0a46e58546252259ed499aa1af08ba080b', '2025-10-20 20:43:46.939895+00', '20251008152505_recurring_schedules', NULL, NULL, '2025-10-20 20:43:46.915584+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('89b1d333-50e9-4622-8cab-fdc9af187f4f', '28943f73214ae3deaf0b889003502a679a3aa341d5333e5e26c1412c29ae4813', '2025-10-20 20:43:48.229022+00', '20251020204348_add_club_management_models', NULL, NULL, '2025-10-20 20:43:48.112877+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0eaddae8-a493-419f-b33e-ecc54f10762c', 'b7942f20429c336a8853840d1432f7741a695b2c1c2a117cd1d9155f02e12e8c', '2025-10-24 16:39:34.411042+00', '20251024163934_add_tournaments_and_training_schedules', NULL, NULL, '2025-10-24 16:39:34.370729+00', 1);


--
-- Data for Name: academies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.academies (id, name, slug, "createdAt", "updatedAt", "odooUrl", "odooDb", "odooClientId", "brandPrimary", "brandSecondary", "brandAccent", "brandNeutral", "brandBackground", "brandForeground", "logoUrl", "logoDarkUrl", "faviconUrl", "ogImageUrl", "defaultThemeMode", currency, timezone, "dateFormat", "taxRate", "useUf", "onboardingCompleted", discipline, sport, type) VALUES ('cmh11cib40002pg211p8j49co', 'Global Jiu Jitsu', 'global-jiu-jitsu', '2025-10-21 20:47:19.216', '2025-10-21 20:47:19.216', NULL, NULL, NULL, '#000000', '#666666', '#0066cc', '#f5f5f5', '#ffffff', '#000000', NULL, NULL, NULL, NULL, 'system', 'CLP', 'America/Santiago', 'DD/MM/YYYY', 0.19, false, true, 'Jiu-Jitsu', NULL, 'ACADEMY');
INSERT INTO public.academies (id, name, slug, "createdAt", "updatedAt", "odooUrl", "odooDb", "odooClientId", "brandPrimary", "brandSecondary", "brandAccent", "brandNeutral", "brandBackground", "brandForeground", "logoUrl", "logoDarkUrl", "faviconUrl", "ogImageUrl", "defaultThemeMode", currency, timezone, "dateFormat", "taxRate", "useUf", "onboardingCompleted", discipline, sport, type) VALUES ('cmh2444zu0001tyrblig4o9pj', 'Shohoku', 'shohoku', '2025-10-22 14:52:33.738', '2025-10-24 02:24:19.083', NULL, NULL, NULL, '#ff7b00', '#666666', '#000000', '#f5f5f5', '#ffffff', '#000000', NULL, NULL, NULL, NULL, 'system', 'CLP', 'America/Santiago', 'DD/MM/YYYY', 0.19, false, true, 'Basketball', 'BASKETBALL', 'CLUB');


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: branch_coaches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: channels; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: class_schedules; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: club_expenses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: content_permissions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: contents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: curricula; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.events (id, "academyId", "branchId", title, description, type, "allDay", "eventDate", "startAt", "endAt", published, important, "createdAt", "updatedAt", "orgId") VALUES ('cmh2f6fd4001ntyrbgajzba2o', 'cmh2444zu0001tyrblig4o9pj', NULL, 'Contra Colo Colo', '', 'CHAMPIONSHIP', false, '2025-10-11 03:00:00', '2025-10-11 18:00:00', '2025-10-11 20:00:00', true, false, '2025-10-22 20:02:16.263', '2025-10-22 20:02:16.263', NULL);


--
-- Data for Name: kpis_cache; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_callup_players; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_callups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: match_player_stats; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.match_player_stats (id, "matchId", "playerId", goals, assists, yellow, red, points, rebounds, steals, blocks, fouls, minutes, "createdAt", "updatedAt") VALUES ('cmh2uy85o001styrb3e88nkim', 'cmh2f6fga001ptyrb8w8ff4eb', 'cmh28ga5f0017tyrbdbfyv3jv', 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, '2025-10-23 03:23:47.532', '2025-10-23 12:11:46.443');
INSERT INTO public.match_player_stats (id, "matchId", "playerId", goals, assists, yellow, red, points, rebounds, steals, blocks, fouls, minutes, "createdAt", "updatedAt") VALUES ('cmh2uy85p001utyrbwh7khtxa', 'cmh2f6fga001ptyrb8w8ff4eb', 'cmh28g9nu000btyrb38i89v9x', 0, 0, 0, 0, 33, 0, 0, 0, 0, 0, '2025-10-23 03:23:47.532', '2025-10-23 12:11:46.443');
INSERT INTO public.match_player_stats (id, "matchId", "playerId", goals, assists, yellow, red, points, rebounds, steals, blocks, fouls, minutes, "createdAt", "updatedAt") VALUES ('cmh2uy85p001wtyrbscqdigpw', 'cmh2f6fga001ptyrb8w8ff4eb', 'cmh28ga3t000rtyrbv1vbi4ax', 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-23 03:23:47.532', '2025-10-23 12:11:46.443');
INSERT INTO public.match_player_stats (id, "matchId", "playerId", goals, assists, yellow, red, points, rebounds, steals, blocks, fouls, minutes, "createdAt", "updatedAt") VALUES ('cmh2uy85p001ytyrbpxhmezfk', 'cmh2f6fga001ptyrb8w8ff4eb', 'cmh27nwmu0007tyrbd8i072h6', 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, '2025-10-23 03:23:47.532', '2025-10-23 12:11:46.443');


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.matches (id, "academyId", sport, date, opponent, location, "homeAway", "goalsFor", "goalsAgainst", "pointsFor", "pointsAgainst", result, status, notes, "createdAt", "updatedAt", "tournamentId") VALUES ('cmh2f6fga001ptyrb8w8ff4eb', 'cmh2444zu0001tyrblig4o9pj', 'BASKETBALL', '2025-10-11 09:00:00', 'Colo Colo', 'Gimnacio Nacional', 'AWAY', NULL, NULL, 55, 22, 'WIN', 'COMPLETED', 'Generado desde evento: Contra Colo Colo', '2025-10-22 20:02:16.378', '2025-10-23 13:20:45.436', NULL);


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk560003i0c17w4azr33', 'cmh11cib40002pg211p8j49co', 'cmh11emay0001djuwultdei25', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.563', '2025-10-21 20:49:41.563', '2025-10-15 03:00:00', NULL, NULL, '2025-11-14 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk5h0007i0c1ch61xf4k', 'cmh11cib40002pg211p8j49co', 'cmh11fk5e0005i0c1v8x3i0fq', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.574', '2025-10-21 20:49:41.574', '2025-10-15 03:00:00', NULL, NULL, '2025-11-15 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk5n000bi0c185oojw5f', 'cmh11cib40002pg211p8j49co', 'cmh11fk5k0009i0c1jwfzvcn5', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.579', '2025-10-21 20:49:41.579', '2025-10-10 03:00:00', NULL, NULL, '2025-11-02 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk5s000fi0c1r8383ez0', 'cmh11cib40002pg211p8j49co', 'cmh11fk5p000di0c1w0s2i8e0', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.585', '2025-10-21 20:49:41.585', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk5y000ji0c1yii0jq69', 'cmh11cib40002pg211p8j49co', 'cmh11fk5v000hi0c1xur8k5hg', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.591', '2025-10-21 20:49:41.591', '2025-10-09 03:00:00', NULL, NULL, '2025-11-07 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk64000ni0c1okz1wwoi', 'cmh11cib40002pg211p8j49co', 'cmh11fk61000li0c1pr1qgl4c', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.596', '2025-10-21 20:49:41.596', '2025-10-09 03:00:00', NULL, NULL, '2025-11-04 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk6w0019i0c1antudj04', 'cmh11cib40002pg211p8j49co', 'cmh11fk6u0017i0c1gelfi6z2', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.624', '2025-10-21 20:49:41.624', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk7c001ji0c18cbury7l', 'cmh11cib40002pg211p8j49co', 'cmh11fk73001hi0c16fwstugu', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.641', '2025-10-21 20:49:41.641', '2025-10-09 03:00:00', NULL, NULL, '2025-11-01 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk7i001ni0c1j6xfds1d', 'cmh11cib40002pg211p8j49co', 'cmh11fk7f001li0c1izrac67y', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.646', '2025-10-21 20:49:41.646', '2025-10-09 03:00:00', NULL, NULL, '2025-11-01 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk7p001ri0c15nwmeaiv', 'cmh11cib40002pg211p8j49co', 'cmh11fk7j001pi0c1bw7aw34n', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.654', '2025-10-21 20:49:41.654', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk7u001vi0c1oysc3zb8', 'cmh11cib40002pg211p8j49co', 'cmh11fk7s001ti0c1sutaocho', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.659', '2025-10-21 20:49:41.659', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk7y001zi0c1m6o7ek36', 'cmh11cib40002pg211p8j49co', 'cmh11fk7w001xi0c1g10vl007', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.663', '2025-10-21 20:49:41.663', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk850023i0c1mfoh56t1', 'cmh11cib40002pg211p8j49co', 'cmh11fk800021i0c1epssduy1', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.669', '2025-10-21 20:49:41.669', '2025-10-09 03:00:00', NULL, NULL, '2025-11-03 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk8a0027i0c1ulwzlj7d', 'cmh11cib40002pg211p8j49co', 'cmh11fk870025i0c1kew8mtj5', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.674', '2025-10-21 20:49:41.674', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk8d002bi0c1m3uz319z', 'cmh11cib40002pg211p8j49co', 'cmh11fk8b0029i0c1yt15y087', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.678', '2025-10-21 20:49:41.678', '2025-10-09 03:00:00', NULL, NULL, '2025-11-09 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk70001di0c1gdnu2gkt', 'cmh11cib40002pg211p8j49co', 'cmh11fk6x001bi0c1ryiojq8r', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.628', '2025-10-21 21:01:46.611', '2025-10-09 03:00:00', NULL, NULL, '2025-10-04 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk6j000xi0c1x3of7dbv', 'cmh11cib40002pg211p8j49co', 'cmh11fk6h000vi0c1npb03sa4', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.611', '2025-10-21 21:01:51.262', '2025-10-09 03:00:00', NULL, NULL, '2025-10-20 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk69000ri0c1oxe2d4dq', 'cmh11cib40002pg211p8j49co', 'cmh11fk66000pi0c1cnr7a937', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.601', '2025-10-21 21:01:53.323', '2025-10-09 03:00:00', NULL, NULL, '2025-10-20 03:00:00', NULL);
INSERT INTO public.memberships (id, "academyId", "userId", "planId", status, "createdAt", "updatedAt", "startDate", "endDate", "trialEndDate", "nextBillingDate", "odooSubscriptionId") VALUES ('cmh11fk6r0013i0c1e44lopln', 'cmh11cib40002pg211p8j49co', 'cmh11fk6n0011i0c1sglyvfpo', 'cmh11cibv0004pg210rpcpqa5', 'ACTIVE', '2025-10-21 20:49:41.619', '2025-10-21 21:02:14.727', '2025-10-09 03:00:00', NULL, NULL, '2025-10-14 03:00:00', NULL);


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organization_members ("organizationId", "userId", role, "createdAt") VALUES ('cmgzls88l0000sgi75viehk2t', 'cmgzls8i80005sgi72oz91gb7', 'ACADEMY_ADMIN', '2025-10-20 20:43:53.008');
INSERT INTO public.organization_members ("organizationId", "userId", role, "createdAt") VALUES ('cmgzls8av0002sgi70acmc2fd', 'cmgzls8iy0007sgi7dt3sebv4', 'ACADEMY_ADMIN', '2025-10-20 20:43:53.018');
INSERT INTO public.organization_members ("organizationId", "userId", role, "createdAt") VALUES ('cmh11ci9h0000pg21x0gtm4r3', 'cmh11cigk0006pg21n6wlykgy', 'ACADEMY_ADMIN', '2025-10-21 20:47:19.419');


--
-- Data for Name: organization_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organization_settings (id, "organizationId", currency, timezone, "taxRate", "themeMode") VALUES ('cmgzls88m0001sgi7v3hmbahk', 'cmgzls88l0000sgi75viehk2t', 'CLP', 'America/Santiago', 0.19, 'system');
INSERT INTO public.organization_settings (id, "organizationId", currency, timezone, "taxRate", "themeMode") VALUES ('cmgzls8av0003sgi7j3l0wqeh', 'cmgzls8av0002sgi70acmc2fd', 'CLP', 'America/Santiago', 0.19, 'system');
INSERT INTO public.organization_settings (id, "organizationId", currency, timezone, "taxRate", "themeMode") VALUES ('cmh11ci9h0001pg21wtu5x28l', 'cmh11ci9h0000pg21x0gtm4r3', 'CLP', 'America/Santiago', 0.19, 'system');


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.organizations (id, name, slug, type, "createdAt", "updatedAt") VALUES ('cmgzls88l0000sgi75viehk2t', 'Demo Academy', 'demoacademy', 'ACADEMY', '2025-10-20 20:43:52.629', '2025-10-20 20:43:52.629');
INSERT INTO public.organizations (id, name, slug, type, "createdAt", "updatedAt") VALUES ('cmgzls8av0002sgi70acmc2fd', 'Demo Club', 'democlub', 'CLUB', '2025-10-20 20:43:52.711', '2025-10-20 20:43:52.711');
INSERT INTO public.organizations (id, name, slug, type, "createdAt", "updatedAt") VALUES ('cmh11ci9h0000pg21x0gtm4r3', 'Global Jiu Jitsu', 'global-jiu-jitsu', 'ACADEMY', '2025-10-21 20:47:19.154', '2025-10-21 20:47:19.154');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh11fk6l000zi0c1hh0yzpny', 'cmh11cib40002pg211p8j49co', 'cmh11fk6j000xi0c1x3of7dbv', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 20:49:41.614', '2025-10-21 21:01:51.24', NULL, NULL, NULL, NULL, NULL, '2025-10-21 21:01:51.014', NULL, 'TRANSFER', NULL, 'cmh11fk6h000vi0c1npb03sa4');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh11fk6s0015i0c1ljvdzmme', 'cmh11cib40002pg211p8j49co', 'cmh11fk6r0013i0c1e44lopln', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 20:49:41.62', '2025-10-21 21:02:14.716', NULL, NULL, NULL, NULL, NULL, '2025-10-16 00:01:00', NULL, 'TRANSFER', NULL, 'cmh11fk6n0011i0c1sglyvfpo');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh11fk72001fi0c1jzwqn2rc', 'cmh11cib40002pg211p8j49co', 'cmh11fk70001di0c1gdnu2gkt', 50000, 'CLP', 'PENDING', 'SUBSCRIPTION', '2025-10-21 20:49:41.63', '2025-10-21 21:02:28.624', NULL, NULL, NULL, NULL, NULL, '2025-10-05 00:01:00', NULL, 'TRANSFER', NULL, 'cmh11fk6x001bi0c1ryiojq8r');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh11fk6a000ti0c1spe9z5rq', 'cmh11cib40002pg211p8j49co', 'cmh11fk69000ri0c1oxe2d4dq', 50000, 'CLP', 'PENDING', 'SUBSCRIPTION', '2025-10-21 20:49:41.602', '2025-10-21 21:02:48.309', NULL, NULL, NULL, NULL, NULL, '2025-10-21 00:01:00', NULL, 'TRANSFER', NULL, 'cmh11fk66000pi0c1cnr7a937');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh1228wi00014uzkea2pfh3h', 'cmh11cib40002pg211p8j49co', 'cmh11fk7y001zi0c1m6o7ek36', 40000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:07:20.082', '2025-10-21 21:07:20.082', NULL, NULL, NULL, NULL, NULL, '2025-10-21 21:07:20.078', NULL, NULL, NULL, 'cmh11fk7w001xi0c1g10vl007');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh1228x600034uzkbgwmot33', 'cmh11cib40002pg211p8j49co', 'cmh11fk7u001vi0c1oysc3zb8', 40000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:07:20.106', '2025-10-21 21:07:20.106', NULL, NULL, NULL, NULL, NULL, '2025-10-21 21:07:20.106', NULL, NULL, NULL, 'cmh11fk7s001ti0c1sutaocho');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh1228xb00054uzk4dj75i1t', 'cmh11cib40002pg211p8j49co', 'cmh11fk7p001ri0c15nwmeaiv', 40000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:07:20.111', '2025-10-21 21:07:20.111', NULL, NULL, NULL, NULL, NULL, '2025-10-21 21:07:20.111', NULL, NULL, NULL, 'cmh11fk7j001pi0c1bw7aw34n');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8ai0001n0z9u2s84jl0', 'cmh11cib40002pg211p8j49co', 'cmh11fk560003i0c17w4azr33', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.442', '2025-10-21 21:20:32.442', NULL, NULL, NULL, NULL, NULL, '2025-10-14 03:00:00', NULL, NULL, NULL, 'cmh11emay0001djuwultdei25');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8b70003n0z9w6r9hf6m', 'cmh11cib40002pg211p8j49co', 'cmh11fk5h0007i0c1ch61xf4k', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.468', '2025-10-21 21:20:32.468', NULL, NULL, NULL, NULL, NULL, '2025-10-15 03:00:00', NULL, NULL, NULL, 'cmh11fk5e0005i0c1v8x3i0fq');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bb0005n0z999hqndc3', 'cmh11cib40002pg211p8j49co', 'cmh11fk5n000bi0c185oojw5f', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.471', '2025-10-21 21:20:32.471', NULL, NULL, NULL, NULL, NULL, '2025-10-02 03:00:00', NULL, NULL, NULL, 'cmh11fk5k0009i0c1jwfzvcn5');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bd0007n0z9aw2vr3v7', 'cmh11cib40002pg211p8j49co', 'cmh11fk5s000fi0c1r8383ez0', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.473', '2025-10-21 21:20:32.473', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk5p000di0c1w0s2i8e0');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bg0009n0z9963fh2h9', 'cmh11cib40002pg211p8j49co', 'cmh11fk5y000ji0c1yii0jq69', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.476', '2025-10-21 21:20:32.476', NULL, NULL, NULL, NULL, NULL, '2025-10-07 03:00:00', NULL, NULL, NULL, 'cmh11fk5v000hi0c1xur8k5hg');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bj000bn0z9lm41su02', 'cmh11cib40002pg211p8j49co', 'cmh11fk64000ni0c1okz1wwoi', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.479', '2025-10-21 21:20:32.479', NULL, NULL, NULL, NULL, NULL, '2025-10-04 03:00:00', NULL, NULL, NULL, 'cmh11fk61000li0c1pr1qgl4c');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bm000dn0z93iuomk7b', 'cmh11cib40002pg211p8j49co', 'cmh11fk6w0019i0c1antudj04', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.482', '2025-10-21 21:20:32.482', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk6u0017i0c1gelfi6z2');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bn000fn0z9w9ktarkc', 'cmh11cib40002pg211p8j49co', 'cmh11fk7c001ji0c18cbury7l', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.484', '2025-10-21 21:20:32.484', NULL, NULL, NULL, NULL, NULL, '2025-10-01 03:00:00', NULL, NULL, NULL, 'cmh11fk73001hi0c16fwstugu');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bq000hn0z9g1gcm4yr', 'cmh11cib40002pg211p8j49co', 'cmh11fk7i001ni0c1j6xfds1d', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.486', '2025-10-21 21:20:32.486', NULL, NULL, NULL, NULL, NULL, '2025-10-01 03:00:00', NULL, NULL, NULL, 'cmh11fk7f001li0c1izrac67y');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bt000jn0z98jwj6yw3', 'cmh11cib40002pg211p8j49co', 'cmh11fk7p001ri0c15nwmeaiv', 40000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.489', '2025-10-21 21:20:32.489', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk7j001pi0c1bw7aw34n');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bv000ln0z9qr34j9js', 'cmh11cib40002pg211p8j49co', 'cmh11fk7u001vi0c1oysc3zb8', 40000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.491', '2025-10-21 21:20:32.491', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk7s001ti0c1sutaocho');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8bw000nn0z9idanypr7', 'cmh11cib40002pg211p8j49co', 'cmh11fk7y001zi0c1m6o7ek36', 40000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.493', '2025-10-21 21:20:32.493', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk7w001xi0c1g10vl007');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8by000pn0z9l0ko2xdm', 'cmh11cib40002pg211p8j49co', 'cmh11fk850023i0c1mfoh56t1', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.495', '2025-10-21 21:20:32.495', NULL, NULL, NULL, NULL, NULL, '2025-10-03 03:00:00', NULL, NULL, NULL, 'cmh11fk800021i0c1epssduy1');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8c1000rn0z9hsx1gll2', 'cmh11cib40002pg211p8j49co', 'cmh11fk8a0027i0c1ulwzlj7d', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.497', '2025-10-21 21:20:32.497', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk870025i0c1kew8mtj5');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8c2000tn0z9cgi4nnoj', 'cmh11cib40002pg211p8j49co', 'cmh11fk8d002bi0c1m3uz319z', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.499', '2025-10-21 21:20:32.499', NULL, NULL, NULL, NULL, NULL, '2025-10-09 03:00:00', NULL, NULL, NULL, 'cmh11fk8b0029i0c1yt15y087');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8c4000vn0z910sk9ki2', 'cmh11cib40002pg211p8j49co', 'cmh11fk70001di0c1gdnu2gkt', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.501', '2025-10-21 21:20:32.501', NULL, NULL, NULL, NULL, NULL, '2025-09-04 04:00:00', NULL, NULL, NULL, 'cmh11fk6x001bi0c1ryiojq8r');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8c6000xn0z9498br5v3', 'cmh11cib40002pg211p8j49co', 'cmh11fk6j000xi0c1x3of7dbv', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.503', '2025-10-21 21:20:32.503', NULL, NULL, NULL, NULL, NULL, '2025-09-20 03:00:00', NULL, NULL, NULL, 'cmh11fk6h000vi0c1npb03sa4');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8c8000zn0z9w4pldym5', 'cmh11cib40002pg211p8j49co', 'cmh11fk69000ri0c1oxe2d4dq', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.504', '2025-10-21 21:20:32.504', NULL, NULL, NULL, NULL, NULL, '2025-09-20 03:00:00', NULL, NULL, NULL, 'cmh11fk66000pi0c1cnr7a937');
INSERT INTO public.payments (id, "academyId", "membershipId", amount, currency, status, type, "createdAt", "updatedAt", "odooTransactionId", "odooMoveId", "odooSubscriptionId", "externalRef", "acquirerCode", "paidAt", "failureReason", method, "eventId", "userId") VALUES ('cmh12j8c90011n0z9qhvzkpc0', 'cmh11cib40002pg211p8j49co', 'cmh11fk6r0013i0c1e44lopln', 50000, 'CLP', 'PAID', 'SUBSCRIPTION', '2025-10-21 21:20:32.505', '2025-10-21 21:20:32.505', NULL, NULL, NULL, NULL, NULL, '2025-09-14 03:00:00', NULL, NULL, NULL, 'cmh11fk6n0011i0c1sglyvfpo');


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.plans (id, "academyId", name, slug, type, status, "createdAt", "updatedAt", price, currency, "trialDays", "setupFee", "classesPerMonth", "unlimitedClasses", "accessToContent", "personalTraining", "competitionAccess", "odooProductId", "odooSubscriptionTemplateId") VALUES ('cmh11cibv0004pg210rpcpqa5', 'cmh11cib40002pg211p8j49co', 'Plan Mensual', 'plan-mensual', 'MONTHLY', 'ACTIVE', '2025-10-21 20:47:19.242', '2025-10-21 20:47:19.242', 50000, 'CLP', 0, 0, 999, true, true, false, false, NULL, NULL);
INSERT INTO public.plans (id, "academyId", name, slug, type, status, "createdAt", "updatedAt", price, currency, "trialDays", "setupFee", "classesPerMonth", "unlimitedClasses", "accessToContent", "personalTraining", "competitionAccess", "odooProductId", "odooSubscriptionTemplateId") VALUES ('cmh3murwg0001yt8pjhsgx9lg', 'cmh2444zu0001tyrblig4o9pj', 'Mensualidad (Completo)', 'mensualidad-completo', 'MONTHLY', 'ACTIVE', '2025-10-23 16:24:55.742', '2025-10-23 16:24:55.742', 55000, 'CLP', 0, 0, 0, false, false, false, false, NULL, NULL);


--
-- Data for Name: player_documents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: player_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: player_goals; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: player_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga0n000htyrb1tpzaxq1', 'cmh28g9zy000ftyrbsycw1sh5', 'Alero', 'L', 11, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.583', '2025-10-22 16:53:58.583');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga1u000ltyrb4ozrwxaw', 'cmh28ga15000jtyrbgahwiikr', 'Pívot', 'XL', 4, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.626', '2025-10-22 16:53:58.626');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga3h000ptyrbaheuxnyw', 'cmh28ga39000ntyrbgabs44m0', 'Base', 'M', 7, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.686', '2025-10-22 16:53:58.686');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga4h000xtyrbkprgixmz', 'cmh28ga4b000vtyrbdqmo8uyv', 'Alero', 'L', 5, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.721', '2025-10-22 16:53:58.721');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga4w0011tyrb71qq2s27', 'cmh28ga4s000ztyrbapaq0spt', 'Escolta', 'M', 8, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.736', '2025-10-22 16:53:58.736');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga590015tyrbjpny892e', 'cmh28ga530013tyrb7k64uqms', 'Base', 'M', 12, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.749', '2025-10-22 16:53:58.749');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga7e001dtyrbf72s4qo7', 'cmh28ga7a001btyrb051ayc0e', 'Base', 'M', 6, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.826', '2025-10-22 16:53:58.826');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga7s001htyrbj8xlsctj', 'cmh28ga7n001ftyrbauwg4vp2', 'Escolta', 'L', 13, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.841', '2025-10-22 16:53:58.841');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga88001ltyrb7ey8yqp6', 'cmh28ga85001jtyrbyolpripl', 'Alero', 'L', 16, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.857', '2025-10-22 16:53:58.857');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga6w0019tyrbkifhgbcf', 'cmh28ga5f0017tyrbdbfyv3jv', 'Ala-Pívot', 'L', 9, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.809', '2025-10-23 12:11:46.471');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28g9tp000dtyrbqcpxb5qm', 'cmh28g9nu000btyrb38i89v9x', 'Alero', 'L', 10, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.326', '2025-10-23 12:11:46.471');
INSERT INTO public.player_profiles (id, "userId", "position", "shirtSize", "preferredNumber", "isMinor", "guardianId", "totalGoals", "totalAssists", "totalPoints", "totalRebounds", "totalSteals", "totalBlocks", "yellowCards", "redCards", fouls, "matchesPlayed", "minutesPlayed", "createdAt", "updatedAt") VALUES ('cmh28ga40000ttyrbip7s3g2j', 'cmh28ga3t000rtyrbv1vbi4ax', 'Escolta', 'L', 14, false, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-10-22 16:53:58.704', '2025-10-23 12:11:46.471');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: student_progress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: techniques; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tournament_standings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: training_attendance; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: training_instances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0002aalmat3vevti', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-10-28 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0003aalm89vk4ngb', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-11-04 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0004aalmu5oqe1xl', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-11-11 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0005aalm1qz2vo7q', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-11-18 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0006aalm31vj14iq', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-11-25 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0007aalmli7xi5xo', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-12-02 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0008aalm24343pld', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-12-09 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh0009aalm8n4q1e3k', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-12-16 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh000aaalm5k95yg24', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-12-23 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh000baalmuwvzkfth', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2025-12-30 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh000caalmtl5eeoxe', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2026-01-06 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh000daalmzoadq7ya', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2026-01-13 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh5304nh000eaalm54a6wefm', 'cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', '2026-01-20 16:44:45.144', '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:44:45.581', '2025-10-24 16:44:45.581');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000haalmpmulmofo', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-10-30 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000iaalmu8sipu6o', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-11-06 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000jaalm3fwn0zba', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-11-13 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000kaalmye25n70a', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-11-20 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000laalmn19k9s6f', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-11-27 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000maalmn343rxo2', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-12-04 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000naalmqwligpqd', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-12-11 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000oaalmb03fnu0q', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-12-18 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000paalm9q91mjz3', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2025-12-25 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000qaalmyo9ej4xl', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2026-01-01 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000raalm9flu9kqh', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2026-01-08 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000saalmk8so4hig', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2026-01-15 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');
INSERT INTO public.training_instances (id, "scheduleId", "academyId", date, "startTime", "endTime", location, type, category, status, notes, "createdAt", "updatedAt") VALUES ('cmh530hh4000taalm4jyz7w2y', 'cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', '2026-01-22 16:45:02.063', '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', 'SCHEDULED', NULL, '2025-10-24 16:45:02.2', '2025-10-24 16:45:02.2');


--
-- Data for Name: training_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.training_schedules (id, "academyId", "dayOfWeek", "startTime", "endTime", location, type, category, "startDate", "endDate", "isActive", "createdAt", "updatedAt") VALUES ('cmh5304n00001aalm8fj18alw', 'cmh2444zu0001tyrblig4o9pj', 2, '18:00', '20:00', 'Av. Las Condes', 'PHYSICAL', 'Equipo', '2025-10-24 16:44:45.144', NULL, true, '2025-10-24 16:44:45.563', '2025-10-24 16:44:45.563');
INSERT INTO public.training_schedules (id, "academyId", "dayOfWeek", "startTime", "endTime", location, type, category, "startDate", "endDate", "isActive", "createdAt", "updatedAt") VALUES ('cmh530hgy000gaalmrq4177sg', 'cmh2444zu0001tyrblig4o9pj', 4, '18:00', '21:00', 'Gimnasio Principal', 'TACTICAL', 'Equipo', '2025-10-24 16:45:02.063', NULL, true, '2025-10-24 16:45:02.195', '2025-10-24 16:45:06.125');


--
-- Data for Name: training_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmgzls8i80005sgi72oz91gb7', NULL, 'admin@demoacademy.local', 'Academy Admin', NULL, '$2a$10$kr4v/lNYr9XXwPtT5iEHBOKQqdRPfScXweWFzPX01SUzbjZx2fWvG', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-20 20:43:52.976', '2025-10-20 20:43:52.976', NULL, NULL, NULL, NULL, NULL, 'cmgzls88l0000sgi75viehk2t');
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmgzls8iy0007sgi7dt3sebv4', NULL, 'admin@democlub.local', 'Club Admin', NULL, '$2a$10$kr4v/lNYr9XXwPtT5iEHBOKQqdRPfScXweWFzPX01SUzbjZx2fWvG', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-20 20:43:53.002', '2025-10-20 20:43:53.002', NULL, NULL, NULL, NULL, NULL, 'cmgzls8av0002sgi70acmc2fd');
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11cigk0006pg21n6wlykgy', 'cmh11cib40002pg211p8j49co', 'jidonoso@resit.cl', 'Admin Global JJ', NULL, '$2a$10$I8sbYVVCE2mo1INNY/HseOedwsHW1OtWodb.aGJUkLdCGYcMvr/9m', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-21 20:47:19.412', '2025-10-21 20:47:19.412', NULL, NULL, NULL, NULL, NULL, 'cmh11ci9h0000pg21x0gtm4r3');
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11emay0001djuwultdei25', 'cmh11cib40002pg211p8j49co', 'arturo-gabarro+globaljj@example.local', 'Arturo Gabarro', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:48:57.706', '2025-10-21 20:49:41.552', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk5e0005i0c1v8x3i0fq', 'cmh11cib40002pg211p8j49co', 'cristobal-bown+globaljj@example.local', 'Cristobal Bown', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.57', '2025-10-21 20:49:41.57', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk5k0009i0c1jwfzvcn5', 'cmh11cib40002pg211p8j49co', 'manuel-rozas+globaljj@example.local', 'Manuel Rozas', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.576', '2025-10-21 20:49:41.576', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk5p000di0c1w0s2i8e0', 'cmh11cib40002pg211p8j49co', 'martin-erguayzarre+globaljj@example.local', 'Martín Erguayzarre', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.581', '2025-10-21 20:49:41.581', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk5v000hi0c1xur8k5hg', 'cmh11cib40002pg211p8j49co', 'lalo-bown+globaljj@example.local', 'Lalo Bown', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.587', '2025-10-21 20:49:41.587', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk61000li0c1pr1qgl4c', 'cmh11cib40002pg211p8j49co', 'hans+globaljj@example.local', 'Hans', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.593', '2025-10-21 20:49:41.593', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk66000pi0c1cnr7a937', 'cmh11cib40002pg211p8j49co', 'felipe-rozas+globaljj@example.local', 'Felipe Rozas', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.598', '2025-10-21 20:49:41.598', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk6h000vi0c1npb03sa4', 'cmh11cib40002pg211p8j49co', 'rafael-gonzalez+globaljj@example.local', 'Rafael Gonzalez', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.609', '2025-10-21 20:49:41.609', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk6n0011i0c1sglyvfpo', 'cmh11cib40002pg211p8j49co', 'agustin+globaljj@example.local', 'Agustin', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.615', '2025-10-21 20:49:41.615', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk6u0017i0c1gelfi6z2', 'cmh11cib40002pg211p8j49co', 'nicolas-conejero+globaljj@example.local', 'Nicolás Conejero', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.622', '2025-10-21 20:49:41.622', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk6x001bi0c1ryiojq8r', 'cmh11cib40002pg211p8j49co', 'claudio-gonzalez+globaljj@example.local', 'Claudio Gonzalez', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.625', '2025-10-21 20:49:41.625', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk73001hi0c16fwstugu', 'cmh11cib40002pg211p8j49co', 'cristian-nino+globaljj@example.local', 'Cristian Niño', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.632', '2025-10-21 20:49:41.632', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk7f001li0c1izrac67y', 'cmh11cib40002pg211p8j49co', 'gerardo-leiva+globaljj@example.local', 'Gerardo Leiva', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.643', '2025-10-21 20:49:41.643', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk7j001pi0c1bw7aw34n', 'cmh11cib40002pg211p8j49co', 'jose-tomas-ovalle+globaljj@example.local', 'Jose Tomas Ovalle', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.648', '2025-10-21 20:49:41.648', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk7s001ti0c1sutaocho', 'cmh11cib40002pg211p8j49co', 'tomas+globaljj@example.local', 'Tomas', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.656', '2025-10-21 20:49:41.656', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk7w001xi0c1g10vl007', 'cmh11cib40002pg211p8j49co', 'max-bottiger+globaljj@example.local', 'Max Bottiger', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.66', '2025-10-21 20:49:41.66', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk800021i0c1epssduy1', 'cmh11cib40002pg211p8j49co', 'sofia-villar+globaljj@example.local', 'Sofia Villar', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.664', '2025-10-21 20:49:41.664', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk870025i0c1kew8mtj5', 'cmh11cib40002pg211p8j49co', 'isamar+globaljj@example.local', 'Isamar', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.671', '2025-10-21 20:49:41.671', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh11fk8b0029i0c1yt15y087', 'cmh11cib40002pg211p8j49co', 'ramiro-jarufe+globaljj@example.local', 'Ramiro Jarufe', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-21 20:49:41.675', '2025-10-21 20:49:41.675', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh24450h0003tyrbjbgvs9ve', 'cmh2444zu0001tyrblig4o9pj', 'jose@gmail.com', 'Jose', '+56978572309', '$2a$12$TnQ0BNlDKP38X23hrWyHd.x8JUICF7ceLIVlrhzIB/pvpl0d/NmBK', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-22 14:52:33.757', '2025-10-22 14:52:33.757', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh27nwmu0007tyrbd8i072h6', 'cmh2444zu0001tyrblig4o9pj', 'juan', 'Juan', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:31:54.864', '2025-10-22 16:31:54.864', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28g9nu000btyrb38i89v9x', 'cmh2444zu0001tyrblig4o9pj', 'hanamichi.sakuragi@shohoku.club', 'Hanamichi Sakuragi', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.119', '2025-10-22 16:53:58.119', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28g9zy000ftyrbsycw1sh5', 'cmh2444zu0001tyrblig4o9pj', 'kaede.rukawa@shohoku.club', 'Kaede Rukawa', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.492', '2025-10-22 16:53:58.492', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga15000jtyrbgahwiikr', 'cmh2444zu0001tyrblig4o9pj', 'takenori.akagi@shohoku.club', 'Takenori Akagi', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.601', '2025-10-22 16:53:58.601', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga39000ntyrbgabs44m0', 'cmh2444zu0001tyrblig4o9pj', 'ryota.miyagi@shohoku.club', 'Ryota Miyagi', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.676', '2025-10-22 16:53:58.676', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga3t000rtyrbv1vbi4ax', 'cmh2444zu0001tyrblig4o9pj', 'hisashi.mitsui@shohoku.club', 'Hisashi Mitsui', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.696', '2025-10-22 16:53:58.696', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga4b000vtyrbdqmo8uyv', 'cmh2444zu0001tyrblig4o9pj', 'kiminobu.kogure@shohoku.club', 'Kiminobu Kogure', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.714', '2025-10-22 16:53:58.714', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga4s000ztyrbapaq0spt', 'cmh2444zu0001tyrblig4o9pj', 'yohei.mito@shohoku.club', 'Yohei Mito', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.732', '2025-10-22 16:53:58.732', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga530013tyrb7k64uqms', 'cmh2444zu0001tyrblig4o9pj', 'nozomi.takamiya@shohoku.club', 'Nozomi Takamiya', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.743', '2025-10-22 16:53:58.743', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga5f0017tyrbdbfyv3jv', 'cmh2444zu0001tyrblig4o9pj', 'chuichiro.noma@shohoku.club', 'Chuichiro Noma', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.755', '2025-10-22 16:53:58.755', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga7a001btyrb051ayc0e', 'cmh2444zu0001tyrblig4o9pj', 'yasuharu.yasuda@shohoku.club', 'Yasuharu Yasuda', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.822', '2025-10-22 16:53:58.822', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga7n001ftyrbauwg4vp2', 'cmh2444zu0001tyrblig4o9pj', 'tetsuo@shohoku.club', 'Tetsuo', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.834', '2025-10-22 16:53:58.834', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmh28ga85001jtyrbyolpripl', 'cmh2444zu0001tyrblig4o9pj', 'ikegami@shohoku.club', 'Ikegami', NULL, NULL, 'STUDENT', 'ACTIVE', '2025-10-22 16:53:58.853', '2025-10-22 16:53:58.853', NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: academies academies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academies
    ADD CONSTRAINT academies_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: branch_coaches branch_coaches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_coaches
    ADD CONSTRAINT branch_coaches_pkey PRIMARY KEY ("branchId", "coachId");


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: channels channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: class_schedules class_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT class_schedules_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: club_expenses club_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_expenses
    ADD CONSTRAINT club_expenses_pkey PRIMARY KEY (id);


--
-- Name: content_permissions content_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT content_permissions_pkey PRIMARY KEY (id);


--
-- Name: contents contents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT contents_pkey PRIMARY KEY (id);


--
-- Name: curricula curricula_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curricula
    ADD CONSTRAINT curricula_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: kpis_cache kpis_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpis_cache
    ADD CONSTRAINT kpis_cache_pkey PRIMARY KEY (id);


--
-- Name: match_callup_players match_callup_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_callup_players
    ADD CONSTRAINT match_callup_players_pkey PRIMARY KEY (id);


--
-- Name: match_callups match_callups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT match_callups_pkey PRIMARY KEY (id);


--
-- Name: match_player_stats match_player_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_player_stats
    ADD CONSTRAINT match_player_stats_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY ("organizationId", "userId");


--
-- Name: organization_settings organization_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: player_documents player_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_documents
    ADD CONSTRAINT player_documents_pkey PRIMARY KEY (id);


--
-- Name: player_evaluations player_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_evaluations
    ADD CONSTRAINT player_evaluations_pkey PRIMARY KEY (id);


--
-- Name: player_goals player_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goals
    ADD CONSTRAINT player_goals_pkey PRIMARY KEY (id);


--
-- Name: player_profiles player_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT player_profiles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: student_progress student_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT student_progress_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: techniques techniques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.techniques
    ADD CONSTRAINT techniques_pkey PRIMARY KEY (id);


--
-- Name: tournament_standings tournament_standings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_standings
    ADD CONSTRAINT tournament_standings_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: training_attendance training_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_pkey PRIMARY KEY (id);


--
-- Name: training_instances training_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_instances
    ADD CONSTRAINT training_instances_pkey PRIMARY KEY (id);


--
-- Name: training_schedules training_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_schedules
    ADD CONSTRAINT training_schedules_pkey PRIMARY KEY (id);


--
-- Name: training_sessions training_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: academies_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX academies_slug_key ON public.academies USING btree (slug);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: attendances_classId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "attendances_classId_userId_key" ON public.attendances USING btree ("classId", "userId");


--
-- Name: badges_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX badges_code_key ON public.badges USING btree (code);


--
-- Name: channels_academyId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "channels_academyId_slug_key" ON public.channels USING btree ("academyId", slug);


--
-- Name: classes_scheduleId_startTime_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "classes_scheduleId_startTime_key" ON public.classes USING btree ("scheduleId", "startTime");


--
-- Name: content_permissions_academyId_coachId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "content_permissions_academyId_coachId_key" ON public.content_permissions USING btree ("academyId", "coachId");


--
-- Name: enrollments_classId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "enrollments_classId_userId_key" ON public.enrollments USING btree ("classId", "userId");


--
-- Name: event_registrations_eventId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON public.event_registrations USING btree ("eventId", "userId");


--
-- Name: kpis_cache_academyId_metric_period_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "kpis_cache_academyId_metric_period_key" ON public.kpis_cache USING btree ("academyId", metric, period);


--
-- Name: match_callup_players_callupId_playerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "match_callup_players_callupId_playerId_key" ON public.match_callup_players USING btree ("callupId", "playerId");


--
-- Name: match_callups_matchId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "match_callups_matchId_key" ON public.match_callups USING btree ("matchId");


--
-- Name: match_player_stats_matchId_playerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "match_player_stats_matchId_playerId_key" ON public.match_player_stats USING btree ("matchId", "playerId");


--
-- Name: matches_tournamentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "matches_tournamentId_idx" ON public.matches USING btree ("tournamentId");


--
-- Name: organization_settings_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "organization_settings_organizationId_key" ON public.organization_settings USING btree ("organizationId");


--
-- Name: organizations_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);


--
-- Name: payments_externalRef_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "payments_externalRef_key" ON public.payments USING btree ("externalRef");


--
-- Name: plans_academyId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "plans_academyId_slug_key" ON public.plans USING btree ("academyId", slug);


--
-- Name: player_profiles_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "player_profiles_userId_key" ON public.player_profiles USING btree ("userId");


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: student_progress_studentId_techniqueId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "student_progress_studentId_techniqueId_key" ON public.student_progress USING btree ("studentId", "techniqueId");


--
-- Name: tournament_standings_tournamentId_teamName_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "tournament_standings_tournamentId_teamName_key" ON public.tournament_standings USING btree ("tournamentId", "teamName");


--
-- Name: training_attendance_instanceId_playerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "training_attendance_instanceId_playerId_key" ON public.training_attendance USING btree ("instanceId", "playerId");


--
-- Name: training_attendance_sessionId_playerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "training_attendance_sessionId_playerId_key" ON public.training_attendance USING btree ("sessionId", "playerId");


--
-- Name: training_instances_academyId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "training_instances_academyId_date_idx" ON public.training_instances USING btree ("academyId", date);


--
-- Name: user_badges_userId_badgeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON public.user_badges USING btree ("userId", "badgeId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: announcements announcements_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: announcements announcements_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assessments assessments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT "assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendances attendances_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendances attendances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: branch_coaches branch_coaches_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_coaches
    ADD CONSTRAINT "branch_coaches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: branch_coaches branch_coaches_coachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_coaches
    ADD CONSTRAINT "branch_coaches_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: branches branches_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "branches_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: channels channels_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT "channels_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: class_schedules class_schedules_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT "class_schedules_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: class_schedules class_schedules_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT "class_schedules_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: class_schedules class_schedules_coachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT "class_schedules_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: classes classes_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_coachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: classes classes_scheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "classes_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES public.class_schedules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: club_expenses club_expenses_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_expenses
    ADD CONSTRAINT "club_expenses_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: club_expenses club_expenses_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.club_expenses
    ADD CONSTRAINT "club_expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: content_permissions content_permissions_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT "content_permissions_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: content_permissions content_permissions_coachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_permissions
    ADD CONSTRAINT "content_permissions_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contents contents_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT "contents_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contents contents_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contents
    ADD CONSTRAINT "contents_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public.channels(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: curricula curricula_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curricula
    ADD CONSTRAINT "curricula_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enrollments enrollments_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enrollments enrollments_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enrollments enrollments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: events events_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "events_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: events events_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "events_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: events events_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: kpis_cache kpis_cache_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpis_cache
    ADD CONSTRAINT "kpis_cache_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_callup_players match_callup_players_callupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_callup_players
    ADD CONSTRAINT "match_callup_players_callupId_fkey" FOREIGN KEY ("callupId") REFERENCES public.match_callups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_callup_players match_callup_players_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_callup_players
    ADD CONSTRAINT "match_callup_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_callups match_callups_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT "match_callups_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_player_stats match_player_stats_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_player_stats
    ADD CONSTRAINT "match_player_stats_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_player_stats match_player_stats_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.match_player_stats
    ADD CONSTRAINT "match_player_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT "matches_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_tournamentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memberships memberships_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberships memberships_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: memberships memberships_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: modules modules_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "modules_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public.curricula(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_members organization_members_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_members organization_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_settings organization_settings_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT "organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public.memberships(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plans plans_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT "plans_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_documents player_documents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_documents
    ADD CONSTRAINT "player_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_documents player_documents_verifiedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_documents
    ADD CONSTRAINT "player_documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: player_evaluations player_evaluations_coachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_evaluations
    ADD CONSTRAINT "player_evaluations_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_evaluations player_evaluations_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_evaluations
    ADD CONSTRAINT "player_evaluations_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_evaluations player_evaluations_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_evaluations
    ADD CONSTRAINT "player_evaluations_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_goals player_goals_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_goals
    ADD CONSTRAINT "player_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_profiles player_profiles_guardianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT "player_profiles_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: player_profiles player_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_profiles
    ADD CONSTRAINT "player_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_progress student_progress_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT "student_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: student_progress student_progress_techniqueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_progress
    ADD CONSTRAINT "student_progress_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES public.techniques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teams teams_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: techniques techniques_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.techniques
    ADD CONSTRAINT "techniques_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public.units(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tournament_standings tournament_standings_tournamentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournament_standings
    ADD CONSTRAINT "tournament_standings_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tournaments tournaments_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT "tournaments_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_attendance training_attendance_instanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT "training_attendance_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES public.training_instances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_attendance training_attendance_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT "training_attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_attendance training_attendance_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT "training_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.training_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_instances training_instances_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_instances
    ADD CONSTRAINT "training_instances_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_instances training_instances_scheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_instances
    ADD CONSTRAINT "training_instances_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES public.training_schedules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: training_schedules training_schedules_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_schedules
    ADD CONSTRAINT "training_schedules_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_sessions training_sessions_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT "training_sessions_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: units units_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT "units_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_badges user_badges_badgeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES public.badges(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_badges user_badges_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_academyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES public.academies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict VkdZVmqzKJJG6Nlme6Pnux3IxPoYlpK26H7OqXB2Qwe0qYE0FJ2l6eeGk04gQyO

