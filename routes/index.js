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
  SELECT meetings.meeting_id, meetings.title, meetings.date, meetings.time, meeting_series.meeting_series_name
  FROM meetings
  JOIN meeting_series ON meetings.series_id = meeting_series.meeting_series_id;
`;
    const allMeetings = await pool.query(query);
    res.json(allMeetings.rows);
  } catch (err) {
    console.error(err.message);
  }
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
