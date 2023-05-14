// jshint esverstion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
mongoose.set("strictQuery", false);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
//   useNewUrlParser: true,
// });
// connect to MongoDB and DatabaseName  Avoid Deprecation Warning//
mongoose.connect(
  "mongodb+srv://admin-negil:Ada3bd16fd@cluster0.2xgfgsx.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

///Mongoose Model //////
const Item = mongoose.model("Item", itemsSchema);

//// Items added to List ////
const Item1 = new Item({
  name: "Welcome to your todolist!",
});

const Item2 = new Item({
  name: "Hit the plus button to add a new item!",
});

const Item3 = new Item({
  name: "Check the box to delete this item!",
});

///// All Item Const Const ///////
const defaultItems = [Item1, Item2, Item3];

/// New Schema for Params when creaing a new list////

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);
//////////// Everything is working fine above this line /////////////
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      // ******** Insert Items if no Items in collection **********

      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

///////////////////////////// Everything Above this line was working fine //////////////////////

/// Creating new Customer List with Name using Params///////////
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  ///find if there is a list under the same name with FindOne ////
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});
// *** Adding a New Item: ***
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

/// Delete Items
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        // mongoose.connection.close();
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

////All of the above code is working fine/////////

////

app.get("/about", function (req, res) {
  res.render("about");
});

// app.listen(3000, function () {
//   console.log("Server started on port 3000");
// });
