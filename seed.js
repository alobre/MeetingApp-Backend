const { Pool } = require('pg');


// Import required packages and configure the pool (similar to index.js)
const pool = new Pool({
    connectionString: 'postgres://pddeltbh:C_DtEUKeLuMCHmeEQE01fBMNNyhIR-W0@cornelius.db.elephantsql.com/pddeltbh',
  });
  
  // Create the users table if it doesn't exist
  pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    user_id serial PRIMARY KEY,
    ldap_name character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    email character varying(255),
    password character varying(255)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id serial PRIMARY KEY,
    user_id integer REFERENCES users(user_id),
    notification_text character varying(255)
);

CREATE TABLE IF NOT EXISTS agendas (
    agenda_id serial PRIMARY KEY,
    is_finalized boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
    meeting_id serial PRIMARY KEY,
    agenda_id integer REFERENCES agendas(agenda_id),
    title character varying(255) NOT NULL,
    date date NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS meeting_series (
    meeting_series_id serial PRIMARY KEY,
	meeting_id integer REFERENCES meetings(meeting_id),
    meeting_series_name character varying(255) NOT NULL,
    user_id integer REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS meeting_members (
    user_id serial PRIMARY KEY,
    meeting_id integer REFERENCES meetings(meeting_id),
    edit_agenda boolean NOT NULL,
    is_owner boolean NOT NULL
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

  `, (err, result) => {
    if (err) {
      console.error('Error creating the tables', err);
    } else {
      console.log('tables created successfully');
    }
  });
  
  // Seed the table with initial data
  pool.query(`
  

  INSERT INTO agendas (is_finalized)
  VALUES
    (true),
    (false);
  
  INSERT INTO meetings (agenda_id, title, date, "start_time", "end_time")
  VALUES
    (1, 'Team Meeting', '2023-10-22', '10:00:00', '11:30:00'),
    (2, 'Project Review', '2023-10-23', '14:00:00', '15:30:00');

  
  
  `, (err, result) => {
    if (err) {
      console.error('Error seeding the users table', err);
    } else {
      console.log('Data seeded successfully');
    }
  });
  