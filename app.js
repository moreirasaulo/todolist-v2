//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//   useNewUrlParser: true,
// }); // LOCAL SERVER ONLY

mongoose.connect("mongodb+srv://sm1983:34651840@cluster0.mx46k.mongodb.net/todolistDB", {useNewUrlParser: true,
});

const itemsSchema = {

  item: String,
};

const Item = mongoose.model("Item", itemsSchema); // Mongoose model usually starts with capital letter

const item1 = new Item({
  item: "Welcome to your ToDo List!",
});

const item2 = new Item({
  item: "Hit the + button to add a new item.",
});

const item3 = new Item({
  item: "Check this box when you're done with your task.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

// Item.insertMany(defaultItems, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("The items were added successfully.");
//   }
// });

// Item.deleteOne({ item: "Check this box to delete an item."}, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Item was deleted successfully.")
//   }
// });

const day = date.getDate();

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to the DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: day, newListItems: foundItems });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    item: itemName,
  });

  if (listName === day) {
    item.save();

    setTimeout(function () {
      res.redirect("/");
   }, 2000); //will call the function after 2 secs. Had to do that because the redirection was happening even before the data insertion was completed and it was loading the page without the new document.
    
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();

      setTimeout(function () {
        res.redirect("/" + listName);
     }, 2000);

    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  // If the removed item is from the "default" list
  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item was successfully removed.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

// This will allow the user to create its own lists, dynamically!
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName); // Lodash will standardize all the custom names for a capital first letter and lower case remaining letters, to avoid differentiation (ex.: home, Home -> Home)

  // Check if the list already exists
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      // If no errors are encountered
      if (!foundList) {
        // If no duplicate was found
        // Create a new list
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

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
