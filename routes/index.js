var express = require("express");
var router = express.Router();
const pool = require("../db");
const { Pool } = require("pg");
const ldap = require("ldapjs");
const fuzzy = require("fuzzy");

/* LOGIN */

const passport = require("passport");
const LdapStrategy = require("passport-ldapauth");

var dn = "ou=people,dc=technikum-wien,dc=at";

// Route for handling login
router.post(
  "/login",
  passport.authenticate("ldapauth", { session: false }),
  (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Both username and email are required" });
    }
    res.json({ success: true, user: req.user });
    res.send();
  }
);

// helper route for adding logged in user to db and saving the ID of user in localstorage
router.post("/users", async (req, res) => {
  const uid = req.body.user.uid;
  const givenName = req.body.user.givenName;
  const sn = req.body.user.sn;
  const mail = req.body.mail;

  try {
    // check if the user exists in the database
    const userQuery = await pool.query(
      "SELECT user_id FROM users WHERE ldap_name = $1",
      [uid]
    );

    if (userQuery.rows.length > 0) {
      // user exists, return id
      res.status(200).json({ userId: userQuery.rows[0].user_id });
    } else {
      // user does not exist, save to db
      const insertQuery = await pool.query(
        "INSERT INTO users (ldap_name, first_name, last_name, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING user_id",
        [uid, givenName, sn, mail, "noPW"]
      );
      const userId = insertQuery.rows[0].user_id;
      res.status(201).json({ userId });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// check if user is already authenticated
function ensureAuthenticated(req, res, next) {
  if (!req.user) {
    res.status(401).json({ success: false, message: "not logged in" });
  } else {
    next();
  }
}

var getLDAPConfiguration = function (req, callback) {
  process.nextTick(function () {
    var opts = {
      server: {
        url: `ldaps://ldap.technikum-wien.at`,
        bindDn: `uid=${req.body.username},${dn}`,
        bindCredentials: `${req.body.password}`,
        searchBase: dn,
        searchFilter: `uid=${req.body.username}`,
        reconnect: true,
      },
    };
    console.log("User:", req.body.username);
    callback(null, opts);
  });
};

passport.use(
  new LdapStrategy(getLDAPConfiguration, function (user, done) {
    console.log("LDAP user ", user, "is logged in.");
    return done(null, user);
  })
);

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/user/:username", (req, res) => {
  console.log("req user", req.params.username);
  const username = req.params.username;

  // fetch LDAP user information
  fetchUserFromLDAP(username)
    .then((ldapUser) => {
      if (!ldapUser) {
        return res.status(404).json({ error: "User not found in LDAP" });
      }

      res.json({ success: true, ldapUser });
    })
    .catch((error) => {
      console.error("Error fetching user from LDAP:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

async function fetchUserFromLDAP(username) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: "ldaps://ldap.technikum-wien.at:636",
    });

    // in bind dn username (uid) from the user that wants to search
    const bindDN = `uid=YOUR_LDAP_UID,ou=people,dc=technikum-wien,dc=at`;

    // bind to the LDAP server (need pw as well - hash, store in localstorage and unhash here?)
    client.bind(bindDN, "YOUR_PW", function (bindError) {
      if (bindError) {
        console.error("LDAP bind failed:", bindError.message);
        reject(bindError);
        return;
      }

      const options = {
        scope: "sub",
        filter: `(&(cn=*${username}*)(ou=people))`,
        attributes: ["cn", "uid", "mail"],
        paged: {
          pageSize: 10,
        },
      };

      const searchDN = "ou=people,dc=technikum-wien,dc=at";
      const entries = [];

      client.search(searchDN, options, function (error, res) {
        console.log("Searching.....");

        res.on("searchEntry", function (entry) {
          console.log(
            "Found a result in searchEntry",
            JSON.stringify(entry.pojo)
          );
          entries.push(entry.pojo);
        });

        res.on("end", function (result) {
          if (result.status === 0) {
            console.log("Search complete.");
            resolve(entries);
          } else {
            console.error("Search failed with status:", result.status);
            reject(
              new Error(`LDAP search failed with status ${result.status}`)
            );
          }

          // unbind from the LDAP server
          client.unbind(function (unbindError) {
            if (unbindError) {
              console.error("Error disconnecting client:", unbindError.message);
            } else {
              console.log("Client disconnected");
            }
          });
        });

        res.on("error", function (error) {
          console.error("Search error:", error.message);
          // if size limit is exceeded, return what was already found
          resolve(entries);
          reject(error);
        });
      });
    });
  });
}

router.get("/getNotifications", async function (req, res, next) {
  try {
    const { active_uid } = req.query;
    console.log(
      "Fetch Notifications from user with id: " + JSON.stringify(req.query)
    );
    // these fields are required for edit agenda details
    const query = `SELECT m.date, m.start_time,m.title, m.agenda_id, mm.edit_agenda, m.meeting_id,
                    m.address, m.building, m.room, m.end_time
                    FROM meeting_members mm
                    JOIN meetings m ON mm.meeting_id = m.meeting_id
                    WHERE mm.user_id = $1;`;
    const allNotifications = await pool.query(query, [active_uid]);
    res.json(allNotifications.rows);
  } catch (err) {
    console.error("Error getting Notifications: " + err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getRightToEdit", async function (req, res) {
  try {
    const { active_uid } = req.query;
    console.log(
      "check if user with id " +
        active_uid +
        " has right to edit for meeting: " +
        req.query.meeting_id
    );
    const query = `SELECT (edit_agenda) FROM "meeting_members" WHERE meeting_id = $1 AND user_id = $2;`;
    const hasRightToEdit = await pool.query(query, [
      req.query.meeting_id,
      active_uid,
    ]);
    console.log(
      "answer from db has right to edit: " + JSON.stringify(hasRightToEdit)
    );
    res.json(hasRightToEdit);
  } catch (err) {
    console.error("Error getting hasRightToEditAgenda: " + err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getMeetings/:id", async function (req, res, next) {
  try {
    userId = req.params.id;
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
  WHERE meetings.meeting_id IN (
    SELECT meeting_id
    FROM meeting_members
    WHERE user_id = $1
  )
  GROUP BY
    meetings.meeting_id,
    meeting_series.meeting_series_name;`;
    const allMeetings = await pool.query(query, [userId]);
    res.json(allMeetings.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get("/users", async (req, res) => {
  pool.query(
    "SELECT COUNT(*) as total_users FROM users; SELECT * FROM users;",
    (err, result) => {
      if (err) {
        console.error("Error executing SQL query", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        const totalUsers = result[0].rows[0].total_users;

        const users = result[1].rows;

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
      // console.log(member);
      var name = member.first_name.split(", ");

      // separate the three strings into variables
      var cn = name[0];
      var full_name = cn.split(" ");
      var first_name_db = full_name[0];
      var last_name_db = full_name[1];
      var uid = name[1];
      var email = name[2];
      var hasRightsToEdit = member.hasRightsToEdit;

      var userResult = await client.query(
        "SELECT user_id FROM users WHERE ldap_name = $1",
        [uid]
      );
      if (userResult.rows.length === 0) {
        userResult = await client.query(
          "INSERT INTO users (ldap_name, first_name, last_name, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING user_id",
          [uid, first_name_db, last_name_db, email, "noPW"]
        );
        // not found error ?
        // throw new Error(`User not found with name: ${uid}`);
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
      var name = member.first_name.split(", ");

      var cn = name[0];
      var full_name = cn.split(" ");
      var first_name_db = full_name[0];
      var last_name_db = full_name[1];
      var uid = name[1];
      var email = name[2];

      var userResult = await client.query(
        "SELECT user_id FROM users WHERE first_name = $1",
        [member.first_name]
      );
      if (userResult.rows.length === 0) {
        userResult = await client.query(
          "INSERT INTO users (ldap_name, first_name, last_name, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING user_id",
          [uid, first_name_db, last_name_db, email, "noPW"]
        );
        // user not found error ?
        // throw new Error(`User not found with name: ${member.first_name}`);
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

    // fetch agenda details
    const agendaQuery = "SELECT * FROM agendas WHERE agenda_id = $1";
    const agendaResult = await client.query(agendaQuery, [agendaId]);
    const agenda = agendaResult.rows[0];

    if (!agenda) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Agenda not found" });
    }

    // fetch action points for the agenda
    const actionPointsQuery =
      "SELECT * FROM action_points WHERE agenda_id = $1";
    const actionPointsResult = await client.query(actionPointsQuery, [
      agendaId,
    ]);
    const actionPoints = actionPointsResult.rows;

    // fetch subpoints for each action point
    for (const actionPoint of actionPoints) {
      const subpointsQuery =
        "SELECT * FROM action_point_subpoints WHERE action_point_id = $1";
      const subpointsResult = await client.query(subpointsQuery, [
        actionPoint.action_point_id,
      ]);
      actionPoint.subpoints = subpointsResult.rows;

      // fetch comments for each action point
      for (const actionPoint of actionPoints) {
        const commentsQuery =
          "SELECT * FROM action_point_comments WHERE action_point_id = $1";
        const commentsResult = await client.query(commentsQuery, [
          actionPoint.action_point_id,
        ]);
        actionPoint.comments = commentsResult.rows;
      }
    }

    // fetch meeting details associated with the agenda
    const meetingQuery = "SELECT * FROM meetings WHERE agenda_id = $1";
    const meetingResult = await client.query(meetingQuery, [agendaId]);
    const meeting = meetingResult.rows[0];

    let meetingMembers = [];

    if (meeting) {
      // fetch meeting members associated with the meeting
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

    await client.query("COMMIT");

    // response obj
    const agendaWithDetails = {
      agenda,
      actionPoints,
      meeting,
      meetingMembers,
    };

    res.json(agendaWithDetails);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});

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
