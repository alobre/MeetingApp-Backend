const { Pool } = require("pg");

// Import required packages and configure the pool (similar to index.js)
const pool = new Pool({
  connectionString:
    "postgres://pddeltbh:C_DtEUKeLuMCHmeEQE01fBMNNyhIR-W0@cornelius.db.elephantsql.com/pddeltbh",
});

// Create tables if it doesn't exist
pool.query(
  `
  -- drop table doesn't work well with seed, i did it direktl in sql elephant browser
  DROP TABLE IF EXISTS action_point_comments CASCADE;
  DROP TABLE IF EXISTS todo CASCADE;
  DROP TABLE IF EXISTS action_point_subpoints CASCADE;
  DROP TABLE IF EXISTS action_points CASCADE;
  DROP TABLE IF EXISTS meeting_members CASCADE;
  DROP TABLE IF EXISTS meeting_series CASCADE;
  DROP TABLE IF EXISTS meetings CASCADE;
  DROP TABLE IF EXISTS agendas CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS users CASCADE;

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



CREATE TABLE IF NOT EXISTS notifications (
    notification_id serial PRIMARY KEY,
    user_id integer REFERENCES users(user_id),
    notification_text character varying(255)
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

  `,
  (err, result) => {
    if (err) {
      console.error("Error creating the tables", err);
    } else {
      console.log("tables created successfully");
    }
  }
);

// Seed the table with initial data
pool.query(
  `
  INSERT INTO meeting_series (meeting_series_name)
  VALUES ('Weekly Team Meetings');
  
  INSERT INTO meeting_series (meeting_series_name)
  VALUES ('Project Meetings');
  
  INSERT INTO users (user_id, ldap_name, first_name, last_name, email, password)
  VALUES (1,'john_doe', 'John', 'Doe', 'john@example.com', 'password123');
  
  INSERT INTO users (user_id, ldap_name, first_name, last_name, email, password)
  VALUES (2, 'jane_smith', 'Jane', 'Smith', 'jane@example.com', 'pass123word');
  
  INSERT INTO users (user_id, ldap_name, first_name, last_name, email, password)
  VALUES (3, 'bob_johnson', 'Bob', 'Johnson', 'bob@example.com', 'securepass321');
  
  INSERT INTO agendas (is_finalized)
    VALUES
      (true),
      (false);
  
      INSERT INTO meetings (meeting_series_id, agenda_id, user_id, title, address, building, room, date, start_time, end_time)
      VALUES (7, 7, 1, 'Team Meeting 1', '123 Main St', 'Office A', 'Conference Room A', '2023-11-24', '09:00', '10:30');
      
      INSERT INTO meetings (meeting_series_id, agenda_id, user_id, title, address, building, room, date, start_time, end_time)
      VALUES (7, 7, 1, 'Team Meeting 2', '123 Main St', 'Office A', 'Conference Room A', '2023-12-01', '09:30', '11:00');
      
      INSERT INTO meetings (meeting_series_id, agenda_id, user_id, title, address, building, room, date, start_time, end_time)
      VALUES (7, 7, 1, 'Team Meeting 3', '123 Main St', 'Office A', 'Conference Room B', '2023-12-08', '10:00', '11:30');
      
      -- Meeting series 2
      INSERT INTO meetings (meeting_series_id, agenda_id, user_id, title, address, building, room, date, start_time, end_time)
      VALUES (8, 8, 2, 'Project Finance', '456 Elm St', 'Office B', 'Meeting Room 1', '2023-11-30', '14:00', '16:00');
      
      INSERT INTO meetings (meeting_series_id, agenda_id, user_id, title, address, building, room, date, start_time, end_time)
      VALUES (8, 8, 2, 'Project Review', '456 Elm St', 'Office B', 'Meeting Room 2', '2023-12-07', '14:30', '16:30');
  
      INSERT INTO action_points (agenda_id, text)
VALUES (7, 'Opening discussion'),
       (7, 'Finance report review');

       INSERT INTO action_points (agenda_id, text)
VALUES (8, 'Opening discussion'),
       (8, 'Finance report review');

-- Inserting action point subpoints
INSERT INTO action_point_subpoints (action_point_id, message)
VALUES (7, 'Discuss upcoming projects'),
       (8, 'Analyze quarterly profits'),
       (8, 'Budget allocation review');

-- Inserting todo items related to action point subpoints
INSERT INTO todo (action_point_subpoint_id, user_id)
VALUES (1, 1),
       (3, 2);

-- Inserting action point comments
INSERT INTO action_point_comments (user_id, comment_text, action_point_id)
VALUES (1, 'Suggest discussing marketing strategies during the opening', 5),
       (2, 'Would like to explore investment options for the finance report', 6);




  `,
  (err, result) => {
    if (err) {
      console.error("Error seeding the users table", err);
    } else {
      console.log("Data seeded successfully");
    }
  }
);
