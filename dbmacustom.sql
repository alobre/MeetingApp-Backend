PGDMP     5    9            	    {           DBMeetingApp    15.2    15.2 O    e           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false            f           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false            g           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false            h           1262    24861    DBMeetingApp    DATABASE     p   CREATE DATABASE "DBMeetingApp" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';
    DROP DATABASE "DBMeetingApp";
                postgres    false            �            1259    24955    action_point_comments    TABLE     �   CREATE TABLE public.action_point_comments (
    action_point_comment_id integer NOT NULL,
    user_id integer NOT NULL,
    comment_text character varying(255) NOT NULL,
    action_point_id integer NOT NULL
);
 )   DROP TABLE public.action_point_comments;
       public         heap    postgres    false            �            1259    24954 1   action_point_comments_action_point_comment_id_seq    SEQUENCE     �   CREATE SEQUENCE public.action_point_comments_action_point_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 H   DROP SEQUENCE public.action_point_comments_action_point_comment_id_seq;
       public          postgres    false    223            i           0    0 1   action_point_comments_action_point_comment_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.action_point_comments_action_point_comment_id_seq OWNED BY public.action_point_comments.action_point_comment_id;
          public          postgres    false    222            �            1259    24924    action_point_subpoints    TABLE     �   CREATE TABLE public.action_point_subpoints (
    action_point_subpoint_id integer NOT NULL,
    action_point_id integer NOT NULL,
    message character varying(2048) NOT NULL
);
 *   DROP TABLE public.action_point_subpoints;
       public         heap    postgres    false            �            1259    24923 3   action_point_subpoints_action_point_subpoint_id_seq    SEQUENCE     �   CREATE SEQUENCE public.action_point_subpoints_action_point_subpoint_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 J   DROP SEQUENCE public.action_point_subpoints_action_point_subpoint_id_seq;
       public          postgres    false    219            j           0    0 3   action_point_subpoints_action_point_subpoint_id_seq    SEQUENCE OWNED BY     �   ALTER SEQUENCE public.action_point_subpoints_action_point_subpoint_id_seq OWNED BY public.action_point_subpoints.action_point_subpoint_id;
          public          postgres    false    218            �            1259    25046    action_points    TABLE     �   CREATE TABLE public.action_points (
    action_point_id integer NOT NULL,
    agenda_id integer NOT NULL,
    text character varying(512) NOT NULL
);
 !   DROP TABLE public.action_points;
       public         heap    postgres    false            �            1259    25045 !   action_points_action_point_id_seq    SEQUENCE     �   CREATE SEQUENCE public.action_points_action_point_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.action_points_action_point_id_seq;
       public          postgres    false    232            k           0    0 !   action_points_action_point_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.action_points_action_point_id_seq OWNED BY public.action_points.action_point_id;
          public          postgres    false    231            �            1259    24863    agendas    TABLE     c   CREATE TABLE public.agendas (
    agenda_id integer NOT NULL,
    is_finalized boolean NOT NULL
);
    DROP TABLE public.agendas;
       public         heap    postgres    false            �            1259    24862    agendas_agenda_id_seq    SEQUENCE     �   CREATE SEQUENCE public.agendas_agenda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.agendas_agenda_id_seq;
       public          postgres    false    215            l           0    0    agendas_agenda_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.agendas_agenda_id_seq OWNED BY public.agendas.agenda_id;
          public          postgres    false    214            �            1259    24971    meeting_members    TABLE     �   CREATE TABLE public.meeting_members (
    user_id integer NOT NULL,
    meeting_id integer NOT NULL,
    edit_agenda boolean NOT NULL,
    is_owner boolean NOT NULL
);
 #   DROP TABLE public.meeting_members;
       public         heap    postgres    false            �            1259    25033    meeting_series    TABLE     �   CREATE TABLE public.meeting_series (
    meeting_series_id integer NOT NULL,
    meeting_series_name character varying(255) NOT NULL,
    user_id integer NOT NULL
);
 "   DROP TABLE public.meeting_series;
       public         heap    postgres    false            �            1259    25032 $   meeting_series_meeting_series_id_seq    SEQUENCE     �   CREATE SEQUENCE public.meeting_series_meeting_series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ;   DROP SEQUENCE public.meeting_series_meeting_series_id_seq;
       public          postgres    false    230            m           0    0 $   meeting_series_meeting_series_id_seq    SEQUENCE OWNED BY     m   ALTER SEQUENCE public.meeting_series_meeting_series_id_seq OWNED BY public.meeting_series.meeting_series_id;
          public          postgres    false    229            �            1259    25016    meetings    TABLE     �   CREATE TABLE public.meetings (
    meeting_id integer NOT NULL,
    series_id integer NOT NULL,
    agenda_id integer,
    title character varying(255) NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL
);
    DROP TABLE public.meetings;
       public         heap    postgres    false            �            1259    25015    meetings_meeting_id_seq    SEQUENCE     �   CREATE SEQUENCE public.meetings_meeting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.meetings_meeting_id_seq;
       public          postgres    false    228            n           0    0    meetings_meeting_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.meetings_meeting_id_seq OWNED BY public.meetings.meeting_id;
          public          postgres    false    227            �            1259    24987    notifications    TABLE     �   CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    notification_text character varying(255)
);
 !   DROP TABLE public.notifications;
       public         heap    postgres    false            �            1259    24986 !   notifications_notification_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 8   DROP SEQUENCE public.notifications_notification_id_seq;
       public          postgres    false    226            o           0    0 !   notifications_notification_id_seq    SEQUENCE OWNED BY     g   ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;
          public          postgres    false    225            �            1259    24938    todo    TABLE     {   CREATE TABLE public.todo (
    todo_id integer NOT NULL,
    subpoint_id integer NOT NULL,
    user_id integer NOT NULL
);
    DROP TABLE public.todo;
       public         heap    postgres    false            �            1259    24937    todo_todo_id_seq    SEQUENCE     �   CREATE SEQUENCE public.todo_todo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.todo_todo_id_seq;
       public          postgres    false    221            p           0    0    todo_todo_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.todo_todo_id_seq OWNED BY public.todo.todo_id;
          public          postgres    false    220            �            1259    24870    users    TABLE     �   CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);
    DROP TABLE public.users;
       public         heap    postgres    false            �            1259    24869    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public          postgres    false    217            q           0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public          postgres    false    216            �           2604    24958 -   action_point_comments action_point_comment_id    DEFAULT     �   ALTER TABLE ONLY public.action_point_comments ALTER COLUMN action_point_comment_id SET DEFAULT nextval('public.action_point_comments_action_point_comment_id_seq'::regclass);
 \   ALTER TABLE public.action_point_comments ALTER COLUMN action_point_comment_id DROP DEFAULT;
       public          postgres    false    223    222    223            �           2604    24927 /   action_point_subpoints action_point_subpoint_id    DEFAULT     �   ALTER TABLE ONLY public.action_point_subpoints ALTER COLUMN action_point_subpoint_id SET DEFAULT nextval('public.action_point_subpoints_action_point_subpoint_id_seq'::regclass);
 ^   ALTER TABLE public.action_point_subpoints ALTER COLUMN action_point_subpoint_id DROP DEFAULT;
       public          postgres    false    218    219    219            �           2604    25049    action_points action_point_id    DEFAULT     �   ALTER TABLE ONLY public.action_points ALTER COLUMN action_point_id SET DEFAULT nextval('public.action_points_action_point_id_seq'::regclass);
 L   ALTER TABLE public.action_points ALTER COLUMN action_point_id DROP DEFAULT;
       public          postgres    false    232    231    232            �           2604    24866    agendas agenda_id    DEFAULT     v   ALTER TABLE ONLY public.agendas ALTER COLUMN agenda_id SET DEFAULT nextval('public.agendas_agenda_id_seq'::regclass);
 @   ALTER TABLE public.agendas ALTER COLUMN agenda_id DROP DEFAULT;
       public          postgres    false    214    215    215            �           2604    25036     meeting_series meeting_series_id    DEFAULT     �   ALTER TABLE ONLY public.meeting_series ALTER COLUMN meeting_series_id SET DEFAULT nextval('public.meeting_series_meeting_series_id_seq'::regclass);
 O   ALTER TABLE public.meeting_series ALTER COLUMN meeting_series_id DROP DEFAULT;
       public          postgres    false    230    229    230            �           2604    25019    meetings meeting_id    DEFAULT     z   ALTER TABLE ONLY public.meetings ALTER COLUMN meeting_id SET DEFAULT nextval('public.meetings_meeting_id_seq'::regclass);
 B   ALTER TABLE public.meetings ALTER COLUMN meeting_id DROP DEFAULT;
       public          postgres    false    227    228    228            �           2604    24990    notifications notification_id    DEFAULT     �   ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);
 L   ALTER TABLE public.notifications ALTER COLUMN notification_id DROP DEFAULT;
       public          postgres    false    226    225    226            �           2604    24941    todo todo_id    DEFAULT     l   ALTER TABLE ONLY public.todo ALTER COLUMN todo_id SET DEFAULT nextval('public.todo_todo_id_seq'::regclass);
 ;   ALTER TABLE public.todo ALTER COLUMN todo_id DROP DEFAULT;
       public          postgres    false    220    221    221            �           2604    24873    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public          postgres    false    216    217    217            Y          0    24955    action_point_comments 
   TABLE DATA           p   COPY public.action_point_comments (action_point_comment_id, user_id, comment_text, action_point_id) FROM stdin;
    public          postgres    false    223   ja       U          0    24924    action_point_subpoints 
   TABLE DATA           d   COPY public.action_point_subpoints (action_point_subpoint_id, action_point_id, message) FROM stdin;
    public          postgres    false    219   �a       b          0    25046    action_points 
   TABLE DATA           I   COPY public.action_points (action_point_id, agenda_id, text) FROM stdin;
    public          postgres    false    232   �a       Q          0    24863    agendas 
   TABLE DATA           :   COPY public.agendas (agenda_id, is_finalized) FROM stdin;
    public          postgres    false    215   (b       Z          0    24971    meeting_members 
   TABLE DATA           U   COPY public.meeting_members (user_id, meeting_id, edit_agenda, is_owner) FROM stdin;
    public          postgres    false    224   Ib       `          0    25033    meeting_series 
   TABLE DATA           Y   COPY public.meeting_series (meeting_series_id, meeting_series_name, user_id) FROM stdin;
    public          postgres    false    230   nb       ^          0    25016    meetings 
   TABLE DATA           Y   COPY public.meetings (meeting_id, series_id, agenda_id, title, date, "time") FROM stdin;
    public          postgres    false    228   �b       \          0    24987    notifications 
   TABLE DATA           T   COPY public.notifications (notification_id, user_id, notification_text) FROM stdin;
    public          postgres    false    226   �b       W          0    24938    todo 
   TABLE DATA           =   COPY public.todo (todo_id, subpoint_id, user_id) FROM stdin;
    public          postgres    false    221   /c       S          0    24870    users 
   TABLE DATA           P   COPY public.users (user_id, first_name, last_name, email, password) FROM stdin;
    public          postgres    false    217   Rc       r           0    0 1   action_point_comments_action_point_comment_id_seq    SEQUENCE SET     _   SELECT pg_catalog.setval('public.action_point_comments_action_point_comment_id_seq', 1, true);
          public          postgres    false    222            s           0    0 3   action_point_subpoints_action_point_subpoint_id_seq    SEQUENCE SET     a   SELECT pg_catalog.setval('public.action_point_subpoints_action_point_subpoint_id_seq', 1, true);
          public          postgres    false    218            t           0    0 !   action_points_action_point_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.action_points_action_point_id_seq', 1, true);
          public          postgres    false    231            u           0    0    agendas_agenda_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.agendas_agenda_id_seq', 1, true);
          public          postgres    false    214            v           0    0 $   meeting_series_meeting_series_id_seq    SEQUENCE SET     R   SELECT pg_catalog.setval('public.meeting_series_meeting_series_id_seq', 2, true);
          public          postgres    false    229            w           0    0    meetings_meeting_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.meetings_meeting_id_seq', 3, true);
          public          postgres    false    227            x           0    0 !   notifications_notification_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, true);
          public          postgres    false    225            y           0    0    todo_todo_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.todo_todo_id_seq', 1, true);
          public          postgres    false    220            z           0    0    users_user_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.users_user_id_seq', 1, true);
          public          postgres    false    216            �           2606    24960 0   action_point_comments action_point_comments_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.action_point_comments
    ADD CONSTRAINT action_point_comments_pkey PRIMARY KEY (action_point_comment_id);
 Z   ALTER TABLE ONLY public.action_point_comments DROP CONSTRAINT action_point_comments_pkey;
       public            postgres    false    223            �           2606    24931 2   action_point_subpoints action_point_subpoints_pkey 
   CONSTRAINT     �   ALTER TABLE ONLY public.action_point_subpoints
    ADD CONSTRAINT action_point_subpoints_pkey PRIMARY KEY (action_point_subpoint_id);
 \   ALTER TABLE ONLY public.action_point_subpoints DROP CONSTRAINT action_point_subpoints_pkey;
       public            postgres    false    219            �           2606    25053     action_points action_points_pkey 
   CONSTRAINT     k   ALTER TABLE ONLY public.action_points
    ADD CONSTRAINT action_points_pkey PRIMARY KEY (action_point_id);
 J   ALTER TABLE ONLY public.action_points DROP CONSTRAINT action_points_pkey;
       public            postgres    false    232            �           2606    24868    agendas agendas_pkey 
   CONSTRAINT     Y   ALTER TABLE ONLY public.agendas
    ADD CONSTRAINT agendas_pkey PRIMARY KEY (agenda_id);
 >   ALTER TABLE ONLY public.agendas DROP CONSTRAINT agendas_pkey;
       public            postgres    false    215            �           2606    24975 $   meeting_members meeting_members_pkey 
   CONSTRAINT     s   ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_pkey PRIMARY KEY (user_id, meeting_id);
 N   ALTER TABLE ONLY public.meeting_members DROP CONSTRAINT meeting_members_pkey;
       public            postgres    false    224    224            �           2606    25038 "   meeting_series meeting_series_pkey 
   CONSTRAINT     o   ALTER TABLE ONLY public.meeting_series
    ADD CONSTRAINT meeting_series_pkey PRIMARY KEY (meeting_series_id);
 L   ALTER TABLE ONLY public.meeting_series DROP CONSTRAINT meeting_series_pkey;
       public            postgres    false    230            �           2606    25021    meetings meetings_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (meeting_id);
 @   ALTER TABLE ONLY public.meetings DROP CONSTRAINT meetings_pkey;
       public            postgres    false    228            �           2606    24992     notifications notifications_pkey 
   CONSTRAINT     k   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);
 J   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
       public            postgres    false    226            �           2606    24943    todo todo_pkey 
   CONSTRAINT     Q   ALTER TABLE ONLY public.todo
    ADD CONSTRAINT todo_pkey PRIMARY KEY (todo_id);
 8   ALTER TABLE ONLY public.todo DROP CONSTRAINT todo_pkey;
       public            postgres    false    221            �           2606    24879    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public            postgres    false    217            �           2606    24877    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    217            �           2606    24961 8   action_point_comments action_point_comments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.action_point_comments
    ADD CONSTRAINT action_point_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 b   ALTER TABLE ONLY public.action_point_comments DROP CONSTRAINT action_point_comments_user_id_fkey;
       public          postgres    false    217    223    3497            �           2606    25054 *   action_points action_points_agenda_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.action_points
    ADD CONSTRAINT action_points_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agendas(agenda_id);
 T   ALTER TABLE ONLY public.action_points DROP CONSTRAINT action_points_agenda_id_fkey;
       public          postgres    false    3493    215    232            �           2606    24976 ,   meeting_members meeting_members_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.meeting_members
    ADD CONSTRAINT meeting_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 V   ALTER TABLE ONLY public.meeting_members DROP CONSTRAINT meeting_members_user_id_fkey;
       public          postgres    false    224    217    3497            �           2606    25039 *   meeting_series meeting_series_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.meeting_series
    ADD CONSTRAINT meeting_series_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 T   ALTER TABLE ONLY public.meeting_series DROP CONSTRAINT meeting_series_user_id_fkey;
       public          postgres    false    217    230    3497            �           2606    25027     meetings meetings_agenda_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agendas(agenda_id);
 J   ALTER TABLE ONLY public.meetings DROP CONSTRAINT meetings_agenda_id_fkey;
       public          postgres    false    215    228    3493            �           2606    24993 (   notifications notifications_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 R   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_user_id_fkey;
       public          postgres    false    217    3497    226            �           2606    24944    todo todo_subpoint_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.todo
    ADD CONSTRAINT todo_subpoint_id_fkey FOREIGN KEY (subpoint_id) REFERENCES public.action_point_subpoints(action_point_subpoint_id);
 D   ALTER TABLE ONLY public.todo DROP CONSTRAINT todo_subpoint_id_fkey;
       public          postgres    false    219    3499    221            �           2606    24949    todo todo_user_id_fkey    FK CONSTRAINT     z   ALTER TABLE ONLY public.todo
    ADD CONSTRAINT todo_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 @   ALTER TABLE ONLY public.todo DROP CONSTRAINT todo_user_id_fkey;
       public          postgres    false    217    221    3497            Y   :   x�3�4��T�H,KU(��MUHLI�,���K�Q��/I-V��SI,�Vp�4����� �)�      U   +   x�3�4�J-�L-W((�O/J-.V��SI,�Vp����� �
?      b   )   x�3�4�t�,N.-.V((��JM.Q(-HI,I-����� �
2      Q      x�3�L����� �S      Z      x�3�4�,�,�����       `   "   x�3�(��JM.Q.I,J)-.�4����� q�y      ^   2   x�3�4�4�IM�U�MM-��K�4202�54�54�44�20 "�=... �x	g      \   =   x�3�4��/U�H,KUHT�K-W�MM-��KW(���/*�/WH,Q04�20Pp������ �?�      W      x�3�4�4����� �X      S   7   x�3������t�O��2�R�SR+srR���s9����R���b���� �ef     