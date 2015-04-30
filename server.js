var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var _ = require('lodash');

var ip = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var connectionURL = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/lumpymunch';

var app = express();  
app.listen(port, ip);

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(session({secret: 'this is the secret'}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));
mongoose.connect(connectionURL);

/***************\
|  DailyIntake  |
\*_____________*/

var DailyIntakeSchema = new mongoose.Schema({
  created: {type: Date, default: Date.now},
  _creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  foods: [{
    ndbno: Number,
    name: String,
    quantity: {type: Number, min: 1, default: 1},
    measure: {type:String, default: "units"},
    energy: {},
    protein: {},
    carbs: {},
    fat: {},
    fiber: {},
  }]
});

var DailyIntake = mongoose.model('DailyIntake', DailyIntakeSchema);

// get all for current user
app.get('/api/dailyintake', function(req, res){
  var creator_id = req.query.creator_id;
  DailyIntake.find({_creator: creator_id}, function(err, docs){
    res.json(docs);
  });
});

// get today if it exists, else create and return it
app.get('/api/dailyintake/today', function(req, res){
  var creator_id = req.query.creator_id;
  DailyIntake.find({_creator: creator_id}).sort({created: -1}).limit(1).exec(function(err, docs){
    var mostRecent = docs[0];
    var hasOneTodayAlready = mostRecent && (mostRecent.created.toDateString() === (new Date).toDateString());

    if(hasOneTodayAlready){
      res.json(mostRecent);
    } else {
      var today = new DailyIntake({_creator: creator_id});
      today.save(function(err){
        if(!err){
          res.json(today);
        } 
      });      
    }
  });
});

// get the last n days of history
app.get('/api/dailyintake/history/:days', function(req, res){
  var creator_id = req.query.creator_id;
  var days = req.params.days;
  DailyIntake.find({_creator: creator_id}).sort({created: -1}).limit(days).exec(function(err, docs){
    var history = [];
    docs.forEach(function(doc){
      var nutrientTotals = {
        energy: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0
      };
      doc.foods.forEach(function(food){
        nutrientTotals.energy += food.energy.value * food.quantity;
        nutrientTotals.protein += food.protein.value * food.quantity;
        nutrientTotals.fat += food.fat.value * food.quantity;
        nutrientTotals.carbs += food.carbs.value * food.quantity;
        nutrientTotals.fiber += food.fiber.value * food.quantity;
      });
      history.push(nutrientTotals);
    });
    res.json(_(history).reverse());
  });
});

// add a food to a daily intake
app.post('/api/dailyintake/:id', function(req, res){
  var id = req.params.id;
  var food = req.body;
  DailyIntake.findById(id, function(err, dailyIntake){
    if(!containsNDBNO(dailyIntake.foods, food.ndbno)){
      dailyIntake.foods.push(food);
      dailyIntake.save(function(err, dailyIntake){
        res.json(dailyIntake);
      });
    } else {
      res.json({errorMessage: "food already exists"});
    }
  });
});

//increment a daily intake by id
app.put('/api/dailyintake/:id/increment', function(req, res){
  var id = req.params.id;
  var foodIndex = req.body.foodIndex;
  DailyIntake.findById(id, function(err, dailyIntake){
    dailyIntake.foods[foodIndex].quantity += 1;
    dailyIntake.save(function(err, dailyIntake){
      res.json(dailyIntake);
    });
  });
});

//decrement a daily intake by id
app.put('/api/dailyintake/:id/decrement', function(req, res){
  var id = req.params.id;
  var foodIndex = req.body.foodIndex;
  DailyIntake.findById(id, function(err, dailyIntake){
    if(dailyIntake.foods[foodIndex].quantity > 1){
      dailyIntake.foods[foodIndex].quantity -= 1;
      dailyIntake.save(function(err, dailyIntake){
        res.json(dailyIntake);
      });
    } else {
      res.json({errorMessage: "cannot decrement below 0"});
    }
  });
});

// delete a single food from a daily intake
app.delete('/api/dailyintake/:id', function(req, res){
  var id = req.params.id;
  var foodIndex = req.query.foodIndex;

  DailyIntake.findById(id, function(err, dailyIntake){
    dailyIntake.foods.splice(foodIndex, 1);
    dailyIntake.save(function(err, dailyIntake){
      res.json(dailyIntake);
    });    
  });
});

//do we have this food?
function containsNDBNO(foods, ndbno){
  var result = false;
  foods.forEach(function(food){    
    if(parseInt(food.ndbno) === parseInt(ndbno)){
      result = true;
    }
  });
  return result;
}


/***************\
|     Users     |
\*_____________*/

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  height: {type: Number, min: 0},               //inches
  weight: {type: Number, min: 0, max: 600},     //pounds
  age: {type: Number, min: 0, max: 100},        //years
  activityLevel: {type: Number, min: 0, max: 4},
  gender: {type: String, default: "male"},
  created: {type: Date, default: Date.now},
  accountType: {type: String, default: "public"},
  followedBy: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
  following: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
});

var User = mongoose.model("User", UserSchema);

//this is where login actually happens
passport.use(new LocalStrategy(function(username, password, done){
  // check username and password
  User.findOne({username: username, password: password}, function(err, user){
    if(user){
      //whatever object you return in the 2nd arg of done gets injected into req
      return done(null, user);
    } else {
      return done(null, false, {message: 'User doesn\'t exist'});
    }
  });
}));

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(user, done){
  done(null, user);
});

app.post('/login', passport.authenticate('local'), function(req, res){
  res.json(req.user); //req.user was injected during a call to done above
});

app.post('/logout', function(req, res){
  req.logOut();
  res.send(200);
});

app.get('/loggedin', function(req, res){
  res.send(req.isAuthenticated() ? req.user : '0');
});

//register a new user
app.post('/register', function(req, res){
  var userJSON = req.body;
  User.findOne({username: userJSON.username}, function(err, user){
    if(user){
      res.json(null);
      return;
    } else {
      var userToSave = new User(userJSON);
      userToSave.save(function(err, user){
        req.login(user, function(err){
          if(err) { return next(err); }
          res.json(user);
        });        
      });
    }
  });
});

//get all users
app.get('/api/user', auth, function(req, res){
  User.find({accountType: "public"}, function(err, users){
    res.json(users);
  });
});

//get a user by id 
app.put('/api/user', auth, function(req, res){
  var userClone = req.body;
  User.findByIdAndUpdate(userClone._id, userClone, function(err, user){
    if(err){ next(err); }
    else {
      res.json(userClone);
    }
  });
});

//get everyone who is followed by this user
app.get('/api/user/followedby', auth, function(req, res){
  var userId = req.query.userId;
  User.findById(userId).populate("followedBy").exec(function(err, user){
    res.json(user.followedBy);
  });
});

//get everyone this user follows
app.get('/api/user/following', auth, function(req, res){
  var userId = req.query.userId;
  User.findById(userId).populate("following").exec(function(err, user){
    res.json(user.following);
  });
});


//add new followers
app.post('/api/user/:id/follow', auth, function(req, res){
  var userId = req.query.userId;
  var otherUserId = req.params.id;
  User.findById(otherUserId, function(err, otherUser){
    //add you to their followedBy
    otherUser.followedBy.push(userId);
    otherUser.save(function(err){
      User.findById(userId, function(err, currentUser){
        //add them to your following
        currentUser.following.push(otherUserId);
        currentUser.save(function(err){
          res.json(currentUser);
        });
      });
    });
  });
});

//remove following
app.post('/api/user/:id/unfollow', auth, function(req, res){
  var userId = req.query.userId;
  var otherUserId = req.params.id;
  User.findById(otherUserId, function(err, otherUser){
    //delete yourself from their followedBy
    var deletionIndex = otherUser.followedBy.indexOf(userId);
    otherUser.followedBy.splice(deletionIndex, 1);
    otherUser.save(function(err){
      User.findById(userId, function(err, currentUser){
        //remove them from your following
        var deletionIndex = currentUser.following.indexOf(otherUserId);
        currentUser.following.splice(deletionIndex);
        currentUser.save(function(err){
          res.json(currentUser);
        });
      });
    });
  });
});

function auth(req, res, next){
  if(!req.isAuthenticated()){
    res.send(401);
  } else {
    next();
  }
};
