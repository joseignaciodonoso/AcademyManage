--
-- PostgreSQL database dump
--

\restrict mJ9dOLLrfebgntRVGWxU3ZvitTNfzPoC7CxmbZbfpBrhv6phwaHrIQXHaJZhJEp

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 17.6

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
    type public."OrganizationType" DEFAULT 'ACADEMY'::public."OrganizationType" NOT NULL,
    sport public."SportType"
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
    method public."PaymentMethod",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "odooTransactionId" text,
    "odooMoveId" integer,
    "odooSubscriptionId" integer,
    "externalRef" text,
    "acquirerCode" text,
    "paidAt" timestamp(3) without time zone,
    "failureReason" text,
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
-- Data for Name: academies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.academies (id, name, slug, "createdAt", "updatedAt", "odooUrl", "odooDb", "odooClientId", "brandPrimary", "brandSecondary", "brandAccent", "brandNeutral", "brandBackground", "brandForeground", "logoUrl", "logoDarkUrl", "faviconUrl", "ogImageUrl", "defaultThemeMode", currency, timezone, "dateFormat", "taxRate", "useUf", "onboardingCompleted", discipline, type, sport) VALUES ('cmgp39c2a00005b3wugxbtcy3', 'GlobalJiujitsu Nunoa', 'globaljiujitsu-nunoa', '2025-10-13 12:07:36.275', '2025-10-13 12:07:36.275', NULL, NULL, NULL, '#000000', '#666666', '#0066cc', '#f5f5f5', '#ffffff', '#000000', NULL, NULL, NULL, NULL, 'system', 'CLP', 'America/Santiago', 'DD/MM/YYYY', 0.19, false, false, NULL, 'ACADEMY', NULL);
INSERT INTO public.academies (id, name, slug, "createdAt", "updatedAt", "odooUrl", "odooDb", "odooClientId", "brandPrimary", "brandSecondary", "brandAccent", "brandNeutral", "brandBackground", "brandForeground", "logoUrl", "logoDarkUrl", "faviconUrl", "ogImageUrl", "defaultThemeMode", currency, timezone, "dateFormat", "taxRate", "useUf", "onboardingCompleted", discipline, type, sport) VALUES ('cmgpbcgwb0000v8qkmofngk0g', 'Global Jiu JItsu', 'jose-ignacio-donoso', '2025-10-13 15:53:59.435', '2025-10-13 15:58:40.022', NULL, NULL, NULL, '#000000', '#666666', '#0066cc', '#f5f5f5', '#ffffff', '#000000', NULL, NULL, NULL, NULL, 'system', 'CLP', 'America/Santiago', 'DD/MM/YYYY', 0.19, false, false, NULL, 'ACADEMY', NULL);
INSERT INTO public.academies (id, name, slug, "createdAt", "updatedAt", "odooUrl", "odooDb", "odooClientId", "brandPrimary", "brandSecondary", "brandAccent", "brandNeutral", "brandBackground", "brandForeground", "logoUrl", "logoDarkUrl", "faviconUrl", "ogImageUrl", "defaultThemeMode", currency, timezone, "dateFormat", "taxRate", "useUf", "onboardingCompleted", discipline, type, sport) VALUES ('cmgzg1qqh0001gameh96vbchg', 'Club Demo', 'club-demo', '2025-10-20 18:03:18.81', '2025-10-20 18:03:18.81', NULL, NULL, NULL, '#000000', '#666666', '#0066cc', '#f5f5f5', '#ffffff', '#000000', NULL, NULL, NULL, NULL, 'system', 'CLP', 'America/Santiago', 'DD/MM/YYYY', 0.19, false, false, 'Basquetnol', 'CLUB', NULL);


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



--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: organization_settings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: -
--



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



--
-- Data for Name: training_schedules; Type: TABLE DATA; Schema: public; Owner: -
--



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

INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmgp39cqy00025b3w6aylsd2n', 'cmgp39c2a00005b3wugxbtcy3', 'jidonoso@gmail.com', NULL, '', '$2a$12$k62hana8ebnF6St61QXD8eBIdaZdWueA36cG3zLF9wZexLVfM3/Zq', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-13 12:07:37.163', '2025-10-13 12:35:12.583', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmgn4jx0i00008jgk8eie0qmt', 'cmgpbcgwb0000v8qkmofngk0g', 'jidonoso@resit.cl', 'Jose Ignacio Donoso', NULL, '$2a$10$Tjbtjfjn81fflrgkt5uk0.AgAGaPs3h3QUL8DzRKvUqkWC/eEUXFq', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-12 03:08:17.249', '2025-10-13 15:53:59.473', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.users (id, "academyId", email, name, phone, password, role, status, "createdAt", "updatedAt", "beltLevel", discipline, "emergencyContact", "medicalNotes", "odooPartnerId", "orgId") VALUES ('cmgzg1qrn0003gamenpxun320', 'cmgzg1qqh0001gameh96vbchg', 'admin@ejemplo.cl', 'Admin', '777464646744', '$2a$12$S.Ayt13EhR.prR.K7IPlXu0/.ozFJ0U7/E4OKSArWRrOjxILI7wAS', 'ACADEMY_ADMIN', 'ACTIVE', '2025-10-20 18:03:18.851', '2025-10-20 18:03:18.851', NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



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

\unrestrict mJ9dOLLrfebgntRVGWxU3ZvitTNfzPoC7CxmbZbfpBrhv6phwaHrIQXHaJZhJEp

