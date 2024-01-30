const { Pool } = require("pg");

// Import required packages and configure the pool (similar to index.js)
const pool = new Pool({
  connectionString:
    "postgres://pddeltbh:C_DtEUKeLuMCHmeEQE01fBMNNyhIR-W0@cornelius.db.elephantsql.com/pddeltbh",
});

// Create tables if it doesn't exist
pool.query(
  `

  CREATE TABLE IF NOT EXISTS users (
    user_id serial PRIMARY KEY,
    ldap_name character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    email character varying(255),
    password character varying(255)
  );

  CREATE TABLE IF NOT EXISTS agendas (
    agenda_id serial PRIMARY KEY,
    is_finalized boolean NOT NULL
  );


  CREATE TABLE IF NOT EXISTS meeting_series (
    meeting_series_id serial PRIMARY KEY,
    meeting_series_name character varying(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meetings (
    meeting_id serial PRIMARY KEY,
    meeting_series_id integer REFERENCES meeting_series(meeting_series_id),
    agenda_id integer REFERENCES agendas(agenda_id),
    user_id integer REFERENCES users(user_id),
    title character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    building character varying(255),
    room character varying(255) NOT NULL,
    date date NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL
  );

  CREATE TABLE IF NOT EXISTS meeting_members (
    user_id integer,
    meeting_id integer,
    edit_agenda boolean NOT NULL,
    is_owner boolean NOT NULL,
    PRIMARY KEY (user_id, meeting_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );



  CREATE TABLE IF NOT EXISTS action_points (
      action_point_id serial PRIMARY KEY,
      agenda_id integer REFERENCES agendas(agenda_id),
      text character varying(512) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS action_point_subpoints (
      action_point_subpoint_id serial PRIMARY KEY,
      action_point_id integer REFERENCES action_points(action_point_id),
      message character varying(2048) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS todo (
      todo_id serial PRIMARY KEY,
      action_point_subpoint_id integer REFERENCES action_point_subpoints(action_point_subpoint_id),
      user_id integer REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS action_point_comments (
      action_point_comment_id serial PRIMARY KEY,
      user_id integer REFERENCES users(user_id),
      comment_text character varying(255) NOT NULL,
      action_point_id integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comment_notes (
    comment_note_id serial PRIMARY KEY,
    action_point_comment_id integer REFERENCES action_point_comments(action_point_comment_id),
    text character varying(16384) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subpoint_notes (
    subpoint_note_id serial PRIMARY KEY,
    action_point_subpoint_id integer REFERENCES action_point_subpoints(action_point_subpoint_id),
    text character varying(16384) NOT NULL
  );

  `,
  (err, result) => {
    if (err) {
      console.error("Error creating the tables", err);
    } else {
      console.log("tables created successfully");
    }
  }
);
