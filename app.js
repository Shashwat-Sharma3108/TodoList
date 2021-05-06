const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/*Database code*/ 
//mongodb://localhost:27017
//mongodb+srv://admin_Shashwat:Binatone@3108@cluster1.yglo4.mongodb.net/todoDB?retryWrites=true&w=majority
mongoose.connect("mongodb+srv://admin_Shashwat:Binatone@3108@cluster1.yglo4.mongodb.net/todoDB?",{
    useNewUrlParser : true,
    useFindAndModify : false
});

const ItemSchema = mongoose.Schema({
  name : {
    required : [true, "Task is Important! can't be empty!"],  
    type : String
  }
});

const Item =  mongoose.model("Item", ItemSchema);

const item1 = new Item({
  name : "Helps you organise your task!"
});

const item2 = new Item({
  name : " Use + to add tasks"
});

const item3 = new Item({
  name : "Check the checkbox to remove a task!"
});

const defaultValues = [item1, item2, item3];

const CustomListSchema = mongoose.Schema({
  name : String,
  items : [ItemSchema]
});

const List = mongoose.model("Customlist", CustomListSchema);

/*Database code Ends*/ 
app.get("/", function(req, res) {

  Item.find((err, result)=>{
    if(result.length === 0){
      Item.insertMany(defaultValues , (err)=>{
        if(err){
          console.log("Default Values Error : "+err);
        }else{

          console.log("Default values inserted Successfully!");
          res.redirect("/");
        }
      });
    } else{
      if(err){
        console.log("error in retriving data from DB : "+err);
      }else{
        res.render("list", {listTitle: 'Today', newListItems: result});
      }
    } 
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName  = req.body.list;

  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    item.save((err)=>{
      if(err){
        console.log("Error due to Inserting New Item : "+err);
        res.redirect("/");
        // res.send("Empty Values aren't accepted!");
      }else{
        console.log("Inserted new item Successfully in " + listName);
        res.redirect("/");
      }
    });
  }else{
    List.findOne( {name : listName}, (err , result)=>{
      result.items.push(item);
      result.save((err)=>{
        if(err){
          console.log("Error due to inserting a new item in custom list "+listName);
        }else{
          console.log("Item added in "+listName);
          res.redirect("/"+listName);
        }
      });
    });
  }
});

app.post("/delete" , (req,res) =>{
  const checkboxId = (req.body.checkbox);
  const listName = req.body.listName;
  // console.log(checkboxId);

  if(listName === "Today"){
    Item.deleteOne({_id : checkboxId} , (err)=>{
      if(err){
        console.log("Deleting item caused error! "+err);
      }else{
        console.log("Item Deleted!");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate(
      {name : listName},
      {$pull : { items : {_id : checkboxId}}},
      (err , result)=>{
        if(err){
          console.log("Error in deleting from custom list : "+listName);
        }else{
          console.log("Deleted from custom List: "+listName);
          res.redirect("/"+listName);
        }
      });
  }
});

app.get("/:customtodoList" , (req,res)=>{
  const customList = _.capitalize(req.params.customtodoList);

  List.findOne( { name : customList} , (err , result)=>{
    if(err){
      console.log("Error in finding the list: "+customList);
    }else{
      if(!result){
        //Creating a list as it doesn't exists!
        console.log("Doesn't Exists!");
        const list = new List({
          name : customList,
          items : defaultValues
        });
      
        list.save( (err)=>{
          if(err){
            console.log("Error in creating dynamic lists "+err);
          }else{
            console.log("Custom list created : "+customList);
            res.redirect("/"+customList);
          }
        });
      }else{
        //Showing the content of list!
        console.log("Exists!"); 

        res.render("list" , {
          listTitle : result.name,
          newListItems: result.items
        });
      }
    }
  }); 
});

app.listen( process.env.PORT || 3000 , function() {
  console.log("Server started on port successfully!");
});