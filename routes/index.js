var express = require("express");
var router = express.Router();
const pool = require("../db");
const { Pool } = require("pg");

/* LOGIN */

const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');

var dn = "ou=people,dc=technikum-wien,dc=at"

/*
//router.post('/login', passport.myLogin)
*/
//post credentials
// Route for handling login
router.post("/login", passport.authenticate('ldapauth', { session: false }), (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Both username and email are required" });
  }
  res.json({ success: true, user: req.user });
  res.send();
  
/*
  pool.query(
    "INSERT INTO users (username, email) VALUES ($1, $2)",
    [username, email],
    (err, result) => {
      if (err) {
        console.error("Error inserting user into the database", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.status(201).json({ message: "User created successfully" });
      }
    }
  );*/
});
/*
router.post('/login', passport.authenticate('ldapauth', { session: false }), (req, res) => {
  // Authentication successful, handle the response
  res.json({ success: true, user: req.user });
  var result;
  res.send(result)
});*/

// check if user is already authenticated
function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "not logged in" })
  } else {
    next()
  }
};
//needed?
/*
router.get("/api/user", ensureAuthenticated, function (req, res) {
    res.json({success: true, user:req.user})
  })
*/
var getLDAPConfiguration = function (req, callback) {
  process.nextTick(function () {
    var opts = {
      server: {
        url: `ldaps://ldap.technikum-wien.at`,
        bindDn: `uid=${req.body.username},${dn}`,
        bindCredentials: `${req.body.password}`,
        searchBase: dn,
        searchFilter: `uid=${req.body.username}`,
        reconnect: true
      }
    };
    console.log("User:", req.body.username);
    callback(null, opts);
  });
};

passport.use(new LdapStrategy(getLDAPConfiguration,
  function (user, done) {
    console.log("LDAP user ", user, "is logged in.");
    return done(null, user);
  }))

  
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/getMeetings", async function (req, res, next) {
  try {
    const query = `
    SELECT
    meetings.meeting_id,
    meetings.meeting_series_id,
    meetings.agenda_id,
    meetings.title,
    meetings.address,
    meetings.building,
    meetings.room,
    meetings.date,
    meetings.start_time,
    meetings.end_time,
    meeting_series.meeting_series_name,
    array_agg(
      jsonb_build_object(
        'user_id', meeting_members.user_id,
        'edit_agenda', meeting_members.edit_agenda,
        'is_owner', meeting_members.is_owner,
        'ldap_name', users.ldap_name,
        'first_name', users.first_name,
        'last_name', users.last_name,
        'email', users.email
      )
    ) AS members
  FROM meetings
  LEFT JOIN meeting_series ON meetings.meeting_series_id = meeting_series.meeting_series_id
  LEFT JOIN meeting_members ON meetings.meeting_id = meeting_members.meeting_id
  LEFT JOIN users ON meeting_members.user_id = users.user_id
  GROUP BY
    meetings.meeting_id,
    meeting_series.meeting_series_name;
  
  
    `;
    const allMeetings = await pool.query(query);
    res.json(allMeetings.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get("/users", async (req, res) => {
  // Use COUNT() to get the total number of users
  pool.query(
    "SELECT COUNT(*) as total_users FROM users; SELECT * FROM users;",
    (err, result) => {
      if (err) {
        console.error("Error executing SQL query", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        // Extract the count from the first query result
        const totalUsers = result[0].rows[0].total_users;

        // Extract user data from the second query result
        const users = result[1].rows;

        // Create a response object with both the count and user data
        const response = {
          totalUsers,
          users,
        };
        res.json(response);
        // res.send(response)
      }
    }
  );
});

router.post("/users", (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res
      .status(400)
      .json({ error: "Both username and email are required" });
  }

  pool.query(
    "INSERT INTO users (username, email) VALUES ($1, $2)",
    [username, email],
    (err, result) => {
      if (err) {
        console.error("Error inserting user into the database", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.status(201).json({ message: "User created successfully" });
      }
    }
  );
});

router.put("/users/:id", (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  if (!username || !email) {
    return res
      .status(400)
      .json({ error: "Both username and email are required" });
  }

  pool.query(
    "UPDATE users SET username = $1, email = $2 WHERE id = $3",
    [username, email, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating user in the database", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json({ message: "User updated successfully" });
      }
    }
  );
});

router.delete("/users/:id", (req, res) => {
  const userId = req.params.id;

  pool.query("DELETE FROM users WHERE id = $1", [userId], (err, result) => {
    if (err) {
      console.error("Error deleting user from the database", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json({ message: "User deleted successfully" });
    }
  });
});

router.post("/meetings", async (req, res) => {
  let client;

  try {
    const meeting = req.body;

    client = await pool.connect();

    // begin transaction
    await client.query("BEGIN");

    // check if a meeting series with the same name already exists
    const seriesResult = await client.query(
      "SELECT meeting_series_id FROM meeting_series WHERE meeting_series_name = $1",
      [meeting.meetingType]
    );

    let meetingSeriesId;

    if (seriesResult.rows.length > 0) {
      // use existing meeting series ID if found
      meetingSeriesId = seriesResult.rows[0].meeting_series_id;
    } else {
      // insert a new meeting series if not found
      const seriesInsertResult = await client.query(
        "INSERT INTO meeting_series (meeting_series_name) VALUES ($1) RETURNING meeting_series_id",
        [meeting.meetingType]
      );

      meetingSeriesId = seriesInsertResult.rows[0].meeting_series_id;
    }

    // insert blank data into agendas table
    const agendaResult = await client.query(
      "INSERT INTO agendas (is_finalized) VALUES (false) RETURNING agenda_id"
    );

    const agendaId = agendaResult.rows[0].agenda_id;

    // insert meeting data into the meetings table with the agenda_id and meeting_series_id
    const meetingResult = await client.query(
      "INSERT INTO meetings (agenda_id, meeting_series_id, title, address, room, date, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING meeting_id",
      [
        agendaId,
        meetingSeriesId,
        meeting.title,
        meeting.address,
        meeting.room,
        meeting.date,
        meeting.start_time,
        meeting.end_time,
      ]
    );

    const meetingId = meetingResult.rows[0].meeting_id;

    // find user ids for the members
    const userIds = [];
    for (const member of meeting.members) {
      const userResult = await client.query(
        "SELECT user_id FROM users WHERE first_name = $1",
        [member.first_name]
      );
      if (userResult.rows.length === 0) {
        // not found error
        throw new Error(`User not found with name: ${member.first_name}`);
      }
      userIds.push(userResult.rows[0].user_id);

      // insert meeting members into the meeting_members table
      await client.query(
        "INSERT INTO meeting_members (user_id, meeting_id, edit_agenda, is_owner) VALUES ($1, $2, COALESCE($3, false), COALESCE($4, false))",

        [
          userResult.rows[0].user_id,
          meetingId,
          member.hasRightsToEdit,
          member.is_owner,
        ]
      );
      // insert notification to added member
      if (!member.hasRightsToEdit) {
        await client.query(
          "INSERT INTO notifications (user_id, notification_text) VALUES ($1, 'You have been invited to a meeting.')",

          [userResult.rows[0].user_id]
        );
      } else {
        await client.query(
          "INSERT INTO notifications (user_id, notification_text) VALUES ($1, 'You have been invited to a meeting, feel free to edit the agenda.')",

          [userResult.rows[0].user_id]
        );
      }
    }

    // commit the transaction
    await client.query("COMMIT");

    res.status(201).json({ message: "Meeting created successfully" });
  } catch (error) {
    // rollback the transaction in case of an error
    // TODO in frontend handle errors
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) {
      client.release();
      client.end();
    }
  }
});

router.put("/meetings", async (req, res) => {
  let client;

  try {
    const { meetingId, meeting } = req.body;

    console.log("Request Body:", req.body);

    client = await pool.connect();

    await client.query("BEGIN");

    const existingMeetingResult = await client.query(
      "SELECT * FROM meetings WHERE meeting_id = $1",
      [meetingId]
    );

    if (existingMeetingResult.rows.length === 0) {
      throw new Error(`Meeting not found with ID: ${meetingId}`);
    }

    const existingMeeting = existingMeetingResult.rows[0];

    if (meeting.meetingAddress !== undefined) {
      existingMeeting.address = meeting.meetingAddress;
    }

    if (meeting.meetingBuilding !== undefined) {
      existingMeeting.building = meeting.meetingBuilding;
    }

    if (meeting.meetingRoom !== undefined) {
      existingMeeting.room = meeting.meetingRoom;
    }

    if (meeting.meetingDate !== undefined) {
      existingMeeting.date = meeting.meetingDate;
    }

    if (meeting.meetingStart !== undefined) {
      existingMeeting.start_time = meeting.meetingStart;
    }

    if (meeting.meetingEnd !== undefined) {
      existingMeeting.end_time = meeting.meetingEnd;
    }

    // update the meeting details
    await client.query(
      "UPDATE meetings SET address = $1, building = $2, room = $3, date = $4, start_time = $5, end_time = $6 WHERE meeting_id = $7",
      [
        existingMeeting.address,
        existingMeeting.building,
        existingMeeting.room,
        existingMeeting.date,
        existingMeeting.start_time,
        existingMeeting.end_time,
        meetingId,
      ]
    );

    // find user ids for the members
    const userIds = [];
    for (const member of meeting.members) {
      const userResult = await client.query(
        "SELECT user_id FROM users WHERE first_name = $1",
        [member.first_name]
      );
      if (userResult.rows.length === 0) {
        // user not found error
        throw new Error(`User not found with name: ${member.first_name}`);
      }

      const userId = userResult.rows[0].user_id;

      // check if the user is already in the meeting_members table
      const userInMeetingResult = await client.query(
        "SELECT * FROM meeting_members WHERE user_id = $1 AND meeting_id = $2",
        [userId, meetingId]
      );

      if (userInMeetingResult.rows.length === 0) {
        // user not in the meeting_members table, so insert
        await client.query(
          "INSERT INTO meeting_members (user_id, meeting_id, edit_agenda, is_owner) VALUES ($1, $2, COALESCE($3, false), COALESCE($4, false))",
          [userId, meetingId, member.hasRightsToEdit, member.is_owner]
        );
      } else {
        console.log(
          `User with ID ${userId} is already in the meeting_members table for meeting ID ${meetingId}`
        );
      }

      userIds.push(userId);

      // insert notification to added member
      if (!member.hasRightsToEdit) {
        await client.query(
          "INSERT INTO notifications (user_id, notification_text) VALUES ($1, 'You have been invited to a meeting.')",

          [userResult.rows[0].user_id]
        );
      } else {
        await client.query(
          "INSERT INTO notifications (user_id, notification_text) VALUES ($1, 'You have been invited to a meeting, feel free to edit the agenda.')",

          [userResult.rows[0].user_id]
        );
      }
    }

    // commit the transaction
    await client.query("COMMIT");

    res.status(200).json({ message: "Meeting details updated successfully" });
  } catch (error) {
    // rollback the transaction in case of an error
    // TODO in frontend handle errors
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) {
      client.release();
      client.end();
    }
  }
});

router.delete("/meetings/:meetingIdToDelete", async (req, res) => {
  const meetingId = req.params.meetingIdToDelete;
  let client;

  try {
    client = await pool.connect();

    // begin the transaction
    await client.query("BEGIN");

    // delete comments associated with action points in the meeting
    await client.query(
      "DELETE FROM action_point_comments WHERE action_point_id IN (SELECT action_point_id FROM action_points WHERE agenda_id IN (SELECT agenda_id FROM meetings WHERE meeting_id = $1))",
      [meetingId]
    );

    // delete subpoints associated with action points in the meeting
    await client.query(
      "DELETE FROM action_point_subpoints WHERE action_point_id IN (SELECT action_point_id FROM action_points WHERE agenda_id IN (SELECT agenda_id FROM meetings WHERE meeting_id = $1))",
      [meetingId]
    );

    // delete action points associated with the meeting
    await client.query(
      "DELETE FROM action_points WHERE agenda_id IN (SELECT agenda_id FROM meetings WHERE meeting_id = $1)",
      [meetingId]
    );

    // delete meeting members associated with the meeting
    await client.query("DELETE FROM meeting_members WHERE meeting_id = $1", [
      meetingId,
    ]);

    // delete the meeting
    await client.query("DELETE FROM meetings WHERE meeting_id = $1", [
      meetingId,
    ]);

    // delete agenda associated with the meeting
    await client.query(
      "DELETE FROM agendas WHERE agenda_id IN (SELECT agenda_id FROM meetings WHERE meeting_id = $1)",
      [meetingId]
    );

    // commit the transaction
    await client.query("COMMIT");

    res
      .status(200)
      .json({ message: "Meeting and associated data deleted successfully." });
  } catch (error) {
    // rollback in case of an error
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get("/agenda/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const agendaId = req.params.id;

    // Fetch agenda details
    const agendaQuery = "SELECT * FROM agendas WHERE agenda_id = $1";
    const agendaResult = await client.query(agendaQuery, [agendaId]);
    const agenda = agendaResult.rows[0];

    if (!agenda) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Agenda not found" });
    }

    // Fetch action points for the agenda
    const actionPointsQuery =
      "SELECT * FROM action_points WHERE agenda_id = $1";
    const actionPointsResult = await client.query(actionPointsQuery, [
      agendaId,
    ]);
    const actionPoints = actionPointsResult.rows;

    // Fetch subpoints for each action point
    for (const actionPoint of actionPoints) {
      const subpointsQuery =
        "SELECT * FROM action_point_subpoints WHERE action_point_id = $1";
      const subpointsResult = await client.query(subpointsQuery, [
        actionPoint.action_point_id,
      ]);
      actionPoint.subpoints = subpointsResult.rows;

      // Fetch comments for each subpoint
      for (const subpoint of actionPoint.subpoints) {
        const commentsQuery =
          "SELECT * FROM action_point_comments WHERE action_point_id = $1";
        const commentsResult = await client.query(commentsQuery, [
          subpoint.action_point_subpoint_id,
        ]);
        subpoint.comments = commentsResult.rows;
      }
    }

    // Fetch meeting details associated with the agenda
    const meetingQuery = "SELECT * FROM meetings WHERE agenda_id = $1";
    const meetingResult = await client.query(meetingQuery, [agendaId]);
    const meeting = meetingResult.rows[0];

    let meetingMembers = [];

    if (meeting) {
      // Fetch meeting members and user names associated with the meeting
      const meetingMembersQuery = `
        SELECT meeting_members.*, users.first_name
        FROM meeting_members
        LEFT JOIN users ON meeting_members.user_id = users.user_id
        WHERE meeting_id = $1
      `;
      const meetingMembersResult = await client.query(meetingMembersQuery, [
        meeting.meeting_id,
      ]);
      meetingMembers = meetingMembersResult.rows;
    }

    // Commit the transaction
    await client.query("COMMIT");

    // Combine everything into a response object
    const agendaWithDetails = {
      agenda,
      actionPoints,
      meeting,
      meetingMembers,
    };

    res.json(agendaWithDetails);
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// router.get("/agenda/:id", (req, res) => {
//   // Use COUNT() to get the total number of users
//   const agenda_id = req.params.id;
//   const query = {
//     text: `SELECT m.meeting_id, m.agenda_id, m.title, m.date, m.start_time, m.end_time, m.end_time, m.address, m.building, m.room,
//     a.is_finalized,
//     ap.text, ap.action_point_id,
//     apc.user_id, apc.comment_text,
//     apsp.action_point_subpoint_id, apsp.message
//     FROM meetings as m
//     JOIN agendas as a ON m.agenda_id = a.agenda_id
//     JOIN action_points as ap ON m.agenda_id = ap.agenda_id
//     JOIN action_point_comments as apc ON apc.action_point_id = ap.action_point_id
//     JOIN action_point_subpoints as apsp ON apsp.action_point_id = ap.action_point_id
//     WHERE m.meeting_id = $1;`,
//     values: [agenda_id],
//   };
//   pool.query(query, (err, result) => {
//     if (err) {
//       console.error("Error executing SQL query", err);
//       res.status(500).json({ error: "Internal server error" });
//     } else {
//       res.send(result.rows[0]);
//     }
//   });
// });

// router.get("/agenda/:id", async (req, res) => {
//   const agendaId = req.params.id;

//   try {
//     const meetingDetailsQuery = `
//       SELECT * FROM meetings
//       WHERE agenda_id = $1;
//     `;

//     const meetingMembersQuery = `
//       SELECT m.user_id, m.is_owner, m.edit_agenda, u.first_name
//       FROM meeting_members m
//       INNER JOIN users u ON m.user_id = u.user_id
//       WHERE m.meeting_id = $1;
//     `;

//     const agendaPointsQuery = `
//     SELECT
//       a.action_point_id,
//       a.text AS action_point_text,
//       aps.action_point_subpoint_id,
//       aps.message AS subpoint_message
//     FROM action_points a
//     LEFT JOIN action_point_subpoints aps ON a.action_point_id = aps.action_point_id
//     WHERE a.agenda_id = $1;
//   `;

//     const commentsQuery = `
//       SELECT apc.action_point_comment_id, apc.comment_text, apc.user_id, u.first_name
//       FROM action_point_comments apc
//       INNER JOIN users u ON apc.user_id = u.user_id
//       WHERE apc.action_point_id IN (SELECT action_point_id FROM action_points WHERE agenda_id = $1);
//     `;

//     const meetingDetails = await pool.query(meetingDetailsQuery, [agendaId]);
//     const meetingMembers = await pool.query(meetingMembersQuery, [agendaId]);
//     const agendaPoints = await pool.query(agendaPointsQuery, [agendaId]);
//     const comments = await pool.query(commentsQuery, [agendaId]);

//     // Construct the response object as per your requirements
//     const response = {
//       meetingDetails: meetingDetails.rows,
//       meetingMembers: meetingMembers.rows,
//       agendaPoints: agendaPoints.rows,
//       comments: comments.rows,
//     };

//     res.json(response);
//   } catch (error) {
//     console.error("Error fetching meeting details:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.get("/actionPoints/:id", async (req, res) => {
  const pool = new Pool({
    connectionString:
      "postgres://pddeltbh:C_DtEUKeLuMCHmeEQE01fBMNNyhIR-W0@cornelius.db.elephantsql.com/pddeltbh",
  });
  const client = await pool.connect();

  const agenda_id = req.params.id;
  const actionPointQuery = {
    text: `SELECT *
    FROM action_points
    WHERE agenda_id = $1;
    `,
    values: [agenda_id],
  };
  let actionPoints;
  client.query(actionPointQuery, async (err, result) => {
    if (err) {
      console.error("Error executing SQL query1", err);
      res.status(500).json({ error: "Internal server error1" });
    } else {
      actionPoints = result.rows;
      // await client.release();
      const promises = actionPoints.map((ap) => {
        const actionPointCommentsQuery = {
          text: `
            SELECT
              action_point_comment_id,
              user_id, 
              comment_text
            FROM action_point_comments
            WHERE action_point_id = $1;
          `,
          values: [ap.action_point_id],
        };

        const actionPointSubPointsQuery = {
          text: `
            SELECT
              action_point_subpoint_id,
              message
            FROM action_point_subpoints
            WHERE action_point_id = $1;
          `,
          values: [ap.action_point_id],
        };

        const commentPromise = new Promise((resolve, reject) => {
          client.query(actionPointCommentsQuery, async (err, result) => {
            if (err) {
              console.error("Error executing comments query2", err);
              reject(err);
            } else {
              ap = { ...ap, actionPointComments: result.rows };
              resolve(ap);
              // await client.release();
            }
          });
        });

        const subPointPromise = new Promise((resolve, reject) => {
          client.query(actionPointSubPointsQuery, async (err, result) => {
            if (err) {
              console.error("Error executing subpoints query3", err);
              reject(err);
            } else {
              ap = { ...ap, actionPointSubPoints: result.rows };
              resolve(ap);
              // await client.release();
            }
          });
        });
        return Promise.all([commentPromise, subPointPromise]).then(() => ap);
      });

      Promise.all(promises)
        .then(async (updatedActionPoints) => {
          res.send(updatedActionPoints);
          await client.release();
          await client.end();
        })
        .catch((error) => {
          console.error("Error in sending queries", error);
          res.status(500).json({ error: "Internal server error" });
        });
    }
  });
});

router.delete("/actionPoint/:id", (req, res) => {
  const action_point_id = req.params.id;

  pool.query(
    "DELETE FROM action_points WHERE action_point_id = $1",
    [action_point_id],
    (err, result) => {
      if (err) {
        console.error("Error deleting user from the database", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json({ message: "actionPoint deleted successfully" });
      }
    }
  );
});
router.delete("/actionPointSubpoint/:id", (req, res) => {
  const action_point_subpoint_id = req.params.id;

  pool.query(
    "DELETE FROM action_point_subpoints WHERE action_point_subpoint_id = $1",
    [action_point_subpoint_id],
    (err, result) => {
      if (err) {
        console.error(
          "Error deleting action_points_subpoint from the database",
          err
        );
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json({ message: "actionPointSubpoint deleted successfully" });
      }
    }
  );
});
router.delete("/actionPointComment/:id", (req, res) => {
  const action_point_comment_id = req.params.id;
  pool.query(
    "DELETE FROM action_point_comments WHERE action_point_comment_id = $1",
    [action_point_comment_id],
    (err, result) => {
      if (err) {
        console.error(
          "Error deleting action_points_comment from the database",
          err
        );
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (result.rowCount === 0) {
          res.status(404).json({ error: "Action point comment not found" });
        } else {
          res.json({ message: "Action point comment deleted successfully" });
        }
      }
    }
  );
});

router.post("/actionPoint", (req, res) => {
  const { text, agenda_id } = req.body;
  const query = {
    text: `INSERT INTO action_points(agenda_id, text) VALUES ($1, $2)`,
    values: [agenda_id, text],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      const query2 = {
        text: `SELECT * FROM action_points WHERE a`,
        values: [agenda_id, text],
      };
      pool.query(query2, (err, result) => {
        if (err) {
          console.error("Error executing SQL query", err);
          res.status(500).json({ error: "Internal server error" });
        } else {
          res.send(result.rows[0]);
        }
      });
    }
  });
});
router.post("/actionPoint", (req, res) => {
  const { text, agenda_id } = req.body;
  const query = {
    text: `INSERT INTO action_points(agenda_id, text) VALUES ($1, $2)`,
    values: [agenda_id, text],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      const query2 = {
        text: `SELECT * FROM action_points WHERE agenda_id = $1`,
        values: [agenda_id],
      };
      pool.query(query2, (err, result) => {
        if (err) {
          console.error("Error executing SQL query", err);
          res.status(500).json({ error: "Internal server error" });
        } else {
          res.send(result.rows[0]);
        }
      });
    }
  });
});
router.put("/actionPoint", (req, res) => {
  const { text, agenda_id } = req.body;
  const query = {
    text: `UPDATE action_points SET text = $1 WHERE agenda_id = $2`,
    values: [text, agenda_id],
  };

  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error updating action point", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.send("Action point updated successfully!");
    }
  });
});

router.post("/actionPointComment", (req, res) => {
  const { user_id, comment_text, action_point_id } = req.body;
  const query = {
    text: `INSERT INTO action_point_comments(user_id, comment_text, action_point_id) VALUES ($1, $2, $3)`,
    values: [user_id, comment_text, action_point_id],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.send("inserted SubPoint successful!");
    }
  });
});
router.put("/actionPointComment", (req, res) => {
  const { user_id, comment_text, action_point_id } = req.body;
  const query = {
    text: `UPDATE action_point_comments SET comment_text = $1 WHERE action_point_id = $2`,
    values: [comment_text, action_point_id],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.send("Action point comment updated successfully!");
    }
  });
});

router.post("/actionPointSubPoint", (req, res) => {
  const { message, action_point_id } = req.body;
  const query = {
    text: `INSERT INTO action_point_subpoints(message, action_point_id) VALUES ($1, $2)`,
    values: [message, action_point_id],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.send("inserted comment successful!");
    }
  });
});
router.put("/actionPointSubPoint", (req, res) => {
  const { message, action_point_subpoint_id } = req.body;
  const query = {
    text: `UPDATE action_point_subpoints SET message = $1 WHERE action_point_subpoint_id = $2`,
    values: [message, action_point_subpoint_id],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.send("Action point subpoint updated successfully!");
    }
  });
});
module.exports = router;
