var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");
var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/NewsScraper", { useNewUrlParser: true });
//============Routes=============================================================
// Route for Scraping
app.get("/scrape", function(req, res) {
  axios.get("https://www.kenyans.co.ke/news/").then((response) => {
    var $ = cheerio.load(response.data);

    $(".news-title-list").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
//============articles created from scrape results========================
      db.Article.create(result)
        .then((dbArticle) => {

          console.log(dbArticle);
        })
        .catch((err) => {
          return res.json(err);
        });
    });
    res.send("Scrape Complete");
  });
});

//===============Get all articles=====================================
app.get("/articles", function(req, res) {
  db.Article.find({})
    .then((dbArticle) => {
      res.json(dbArticle);
    })
    .catch((err) => {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then((dbArticle) => {
      res.json(dbArticle);
    })
    .catch((err) => {
      res.json(err);
    });
});

// Route for saving/updating
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then((dbNote) => {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then((dbArticle) => {
      res.json(dbArticle);
    })
    .catch((err) => {
      res.json(err);
    });
});

app.get("/delete/:id", function(req,res) {
  db.Note.remove({ _id: req.params.id});
  db.Note.find({})
  .then((dbNote) => {
    res.json(dbNote);
    })
    .catch((err) => {
      res.json(err);
    });
    console.log("Successfully Removed");
  })

app.listen(PORT, () => {
  console.log("App running on port " + PORT + "!");
});