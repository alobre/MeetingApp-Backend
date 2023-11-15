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
      SELECT meetings.meeting_id, meetings.agenda_id, meetings.title, meetings.date, meetings.start_time, meetings.end_time, meeting_series.meeting_series_name
      FROM meetings
      LEFT JOIN meeting_series ON meetings.meeting_id = meeting_series.meeting_id;
    `;
    const allMeetings = await pool.query(query);
    res.json(allMeetings.rows);
  } catch (err) {
    console.error(err.message);
  }
});
router.post('/meetings', (req, res) => {
  const meeting = req.body;
  console.log(req.body)
  // pool.query('DELETE FROM meetings WHERE id = $1', [meeting_id], (err, result) => {
  //   if (err) {
  //     console.error('Error deleting user from the database', err);
  //     res.status(500).json({ error: 'Internal server error' });
  //   } else {
  //     res.json({ message: 'Meeting deleted successfully' });
  //   }
  // });
});

router.get('/users', (req, res) => {
  // Use COUNT() to get the total number of users
  pool.query('SELECT COUNT(*) as total_users FROM users; SELECT * FROM users;', (err, result) => {
    if (err) {
      console.error('Error executing SQL query', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      console.log(result)
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
  });
});

router.post('/users', (req, res) => {
  const { username, email } = req.body;
  console.log(req.body)

  if (!username || !email) {
    return res.status(400).json({ error: 'Both username and email are required' });
  }

  pool.query('INSERT INTO users (username, email) VALUES ($1, $2)', [username, email], (err, result) => {
    if (err) {
      console.error('Error inserting user into the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.status(201).json({ message: 'User created successfully' });
    }
  });
});

router.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Both username and email are required' });
  }

  pool.query('UPDATE users SET username = $1, email = $2 WHERE id = $3', [username, email, userId], (err, result) => {
    if (err) {
      console.error('Error updating user in the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'User updated successfully' });
    }
  });
});


router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;

  pool.query('DELETE FROM users WHERE id = $1', [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user from the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'User deleted successfully' });
    }
  });
});

router.post('/meetings', (req, res) => {
  const meeting_id = req.params.id;
  console.log(req.params)
  // pool.query('DELETE FROM meetings WHERE id = $1', [meeting_id], (err, result) => {
  //   if (err) {
  //     console.error('Error deleting user from the database', err);
  //     res.status(500).json({ error: 'Internal server error' });
  //   } else {
  //     res.json({ message: 'Meeting deleted successfully' });
  //   }
  // });
});

router.delete('/meetings/:id', (req, res) => {
  const meeting_id = req.params.id;

  pool.query('DELETE FROM meetings WHERE id = $1', [meeting_id], (err, result) => {
    if (err) {
      console.error('Error deleting user from the database', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ message: 'Meeting deleted successfully' });
    }
  });
});

router.get('/agenda/:id', (req, res) => {
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
    values: [agenda_id]
  };
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error executing SQL query', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.send(result.rows[0])
    }
  });
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
