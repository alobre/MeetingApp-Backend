var express = require("express");
var router = express.Router();
const pool = require("../db");

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

router.get("/users", (req, res) => {
  // Use COUNT() to get the total number of users
  pool.query(
    "SELECT COUNT(*) as total_users FROM users; SELECT * FROM users;",
    (err, result) => {
      if (err) {
        console.error("Error executing SQL query", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        console.log(result);
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
  console.log(req.body);

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
        [member.name]
      );
      if (userResult.rows.length === 0) {
        // not found error
        throw new Error(`User not found with name: ${member.name}`);
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
    }
  }
});

router.get("/agenda/:id", (req, res) => {
  // Use COUNT() to get the total number of users
  const agenda_id = req.params.id;
  const query = {
    text: `SELECT m.meeting_id, m.agenda_id, m.title, m.date, m.start_time, m.end_time, a.is_finalized, ap.text, ap.action_point_id, apc.user_id, apc.comment_text, apsp.action_point_subpoint_id, apsp.message
    FROM meetings as m
    JOIN agendas as a ON m.agenda_id = a.agenda_id
    JOIN action_points as ap ON m.agenda_id = ap.agenda_id
    JOIN action_point_comments as apc ON apc.action_point_id = ap.action_point_id
    JOIN action_point_subpoints as apsp ON apsp.action_point_id = ap.action_point_id
    WHERE m.meeting_id = $1;`,
    values: [agenda_id],
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.send(result.rows[0]);
    }
  });
});
router.get("/actionPoints/:id", (req, res) => {
  const agenda_id = req.params.id;
  const actionPointQuery = {
    text: `SELECT *
    FROM action_points
    WHERE agenda_id = $1;
    `,
    values: [agenda_id],
  };
  let actionPoints;
  pool.query(actionPointQuery, (err, result) => {
    if (err) {
      console.error("Error executing SQL query", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      actionPoints = result.rows;

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
          pool.query(actionPointCommentsQuery, (err, result) => {
            if (err) {
              console.error("Error executing comments query", err);
              reject(err);
            } else {
              ap = { ...ap, actionPointComments: result.rows };
              resolve(ap);
            }
          });
        });

        const subPointPromise = new Promise((resolve, reject) => {
          pool.query(actionPointSubPointsQuery, (err, result) => {
            if (err) {
              console.error("Error executing subpoints query", err);
              reject(err);
            } else {
              ap = { ...ap, actionPointSubPoints: result.rows };
              resolve(ap);
            }
          });
        });

        return Promise.all([commentPromise, subPointPromise]).then(() => ap);
      });

      Promise.all(promises)
        .then((updatedActionPoints) => {
          res.send(updatedActionPoints);
        })
        .catch((error) => {
          console.error("Error in processing queries", error);
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
    "DELETE FROM action_points_subpoints WHERE action_point_subpoint_id = $1",
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

module.exports = router;

// from routerget
// let meetings = [
//   {
//     meetingID: 1231,
//     date: "2023-07-05",
//     startTime: "12:15",
//     endTime: "14:20",
//     title: "Meeting Board",
//     meetingAddress: "Hoechstadtplatz 5",
//     meetingBuilding: "A",
//     meetingRoom: "4.04",
//     meetingPlace: "FHTW F1.02",
//     meetingType: "Project Stardust",
//     actionPoints: [
//       {
//         title: "Opening",
//         subPoints: [{ title: "Quick introductions" }],
//         comments: [],
//       },
//       {
//         title: "Courses schedule",
//         subPoints: [
//           { title: "Appropriate time for courses" },
//           { title: "Changing the 8AM time slots" },
//         ],
//         comments: [],
//       },
//       {
//         title: "Moodle quiz system bugs",
//         subPoints: [
//           { title: "Reported issues" },
//           { title: "Plans for updates" },
//         ],
//         comments: [],
//       },
//     ],
//   },
//   {
//     meetingID: 1523,
//     date: "2023-07-03",
//     startTime: "12:15",
//     endTime: "14:20",
//     title: "Project Stardust Team Meeting",
//     meetingAddress: "Hoechstadtplatz 5",
//     meetingBuilding: "A",
//     meetingRoom: "4.04",
//     meetingPlace: "FHTW F1.02",
//     meetingType: "IT Department",
//     actionPoints: [
//       {
//         title: "Beginning",
//         subPoints: [{ title: "Say something" }],
//         comments: [],
//       },
//       {
//         title: "Morning classes",
//         subPoints: [
//           { title: "Appropriate time for courses" },
//           { title: "Changing the 8AM time slots" },
//         ],
//         comments: [],
//       },
//       {
//         title: "Ferien",
//         subPoints: [
//           { title: "Reported issues" },
//           { title: "Plans for updates" },
//         ],
//         comments: [],
//       },
//     ],
//   },
//   {
//     meetingID: 1233,
//     date: "2023-07-02",
//     startTime: "12:15",
//     endTime: "14:20",
//     title: "Board Meeting II",
//     meetingAddress: "Hoechstadtplatz 5",
//     meetingBuilding: "A",
//     meetingRoom: "4.04",
//     meetingPlace: "FHTW F1.02",
//     meetingType: "IT Department",
//     actionPoints: [
//       {
//         title: "Introductions",
//         subPoints: [{ title: "Quick introductions" }],
//         comments: [],
//       },
//       {
//         title: "Grading",
//         subPoints: [
//           { title: "Appropriate time for courses" },
//           { title: "Changing the 8AM time slots" },
//         ],
//         comments: [],
//       },
//       {
//         title: "Salaries",
//         subPoints: [
//           { title: "Reported issues" },
//           { title: "Plans for updates" },
//         ],
//         comments: [],
//       },
//     ],
//   },
//   {
//     meetingID: 1123,
//     date: "2023-07-04",
//     startTime: "12:15",
//     endTime: "14:20",
//     title: "Meeting Board IV",
//     meetingAddress: "Hoechstadtplatz 5",
//     meetingBuilding: "A",
//     meetingRoom: "4.04",
//     meetingPlace: "FHTW F1.02",
//     meetingType: "Board",
//     actionPoints: [
//       {
//         title: "Opening",
//         subPoints: [{ title: "Quick introductions" }],
//         comments: [],
//       },
//       {
//         title: "External contractors",
//         subPoints: [
//           { title: "Appropriate time for courses" },
//           { title: "Changing the 8AM time slots" },
//         ],
//         comments: [],
//       },
//       {
//         title: "CIS bugs",
//         subPoints: [
//           { title: "Reported issues" },
//           { title: "Plans for updates" },
//         ],
//         comments: [],
//       },
//     ],
//   },
//   {
//     meetingID: 1453,
//     date: "2023-07-01",
//     startTime: "12:15",
//     endTime: "14:20",
//     title: "Semester Opening",
//     meetingAddress: "Hoechstadtplatz 5",
//     meetingBuilding: "A",
//     meetingRoom: "4.04",
//     meetingPlace: "FHTW F1.02",
//     meetingType: "Project Stardust",
//     actionPoints: [
//       {
//         title: "Meeting beginning",
//         subPoints: [{ title: "Quick introductions" }],
//         comments: [],
//       },
//       {
//         title: "Student questions",
//         subPoints: [{ title: "Appropriate time for courses" }],
//         comments: [],
//       },
//       {
//         title: "Answers",
//         subPoints: [
//           { title: "Reported issues" },
//           { title: "Plans for updates" },
//         ],
//         comments: [],
//       },
//     ],
//   },
// ];
