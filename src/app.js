const express = require('express');
const bodyParser = require('body-parser');
const ejs= require('ejs');
const session = require('express-session');
const Sequelize = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);



// CONFIG dependencies
const app = express ();

app.set('view engine', 'ejs');
app.set('views', 'src/views')

app.use(express.static('public'));

const sequelize = new Sequelize(process.env.BLOGAPP,process.env.POSTGRES_USER,null,{
  host: 'localhost',
  dialect: 'postgres',
  port: 5433
})

app.use(bodyParser.urlencoded({extended: true}))

//Session

app.use(session({
  store: new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
    expiration: 24 * 60 * 60 * 1000 // The maximum age (in milliseconds) of a valid session.
  }),
  secret: "safe",
  saveUnitialized: true,
  resave: false
}))

//MODELS DEFINITION

const User = sequelize.define('users',{
  username: {
    type: Sequelize.STRING,
    unique: true
  },
  email: {
    type: Sequelize.STRING,
    unique: true
  },
  password:{
    type: Sequelize.STRING
  }
  },{
  timestamps: false
  });


  const Post = sequelize.define('posts',{
    title: {
      type: Sequelize.STRING,
      unique: true
    },
    body: {
      type: Sequelize.STRING,
    },
    },{
    timestamps: false
    });

    const Comments = sequelize.define('comments',{
      com: {
        type: Sequelize.STRING,
      }
    },
      {
      timestamps: false
      });

      // TABLES RELATIONSHIP/ASSOCIATION
      User.hasMany(Post);
      Post.belongsTo(User);

      User.hasMany(Comments);
      Comments.belongsTo(User);

      Post.hasMany(Comments);
      Comments.belongsTo(Post);


//Routes
// Home and sign in.
app.get('/', function(req,res){
  let user = req.session.user
  res.render('signin')
})

app.post('/', function (req, res) {

  let email = req.body.email;
	let password = req.body.password;

	console.log('Just to make sure I get: '+email+" "+password);

	if(email.length === 0) {
		res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(password.length === 0) {
		res.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: email
		}
	}).then(function(user){

			if(email!== null && password === user.password){
        req.session.user = user;
				res.redirect('/myprofile/:id');
			} else {
				res.redirect('/?message=' + encodeURIComponent('Invalid email or password.'));
			}


	})
  .catch(function(error){
    res.redirect('/')
  })
});

// Log Out
app.get('/logout', (req,res)=>{
  req.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
})

// SIGN up
app.get('/signup', function(req, res){
	res.render("signup");
})

app.post('/signup', function(req, res){

	let inputusername = req.body.username
  let inputemail = req.body.email
	let inputpassword = req.body.password

	console.log("I am receiving following user credentials: "+inputusername+" "+inputpassword);

			User.create({
				username: inputusername,
        email: inputemail,
				password: inputpassword
			}).then( () => {
				res.redirect('/?message=' + encodeURIComponent("Your account got successfully created. Log in below."));
			})
      .catch(function(error){
        res.redirect('/signup')
      })
})

// My Profile
app.get('/myprofile/:id', (req,res)=>{

  const user = req.session.user;

  Post.findAll({
  where: {
    userId: req.session.user.id
  },
  include: [{
    model: User
  }]
})
.then(function(order){
  res.render("myprofile", {user: user, order:order});
})
});


// Add posts.
app.post('/myprofile/:id', function(req, res) {

	let user = req.session.user.username;
	let inputtitle = req.body.title;
  let inputbody = req.body.body;

	User.findOne({
		where: {
			username: user
		}
	})
	.then(function(user){
		return user.createPost({
			title: inputtitle,
      body: inputbody
		})
	})
	.then( post => {
		res.redirect(`/myprofile/:id`);
	})
});


// View all posts
app.get('/vpost', (req, res) => {
  const user = req.session.user;

  if(user === null || user === undefined){
    res.redirect('/');
  } else {
  Post.findAll().then(posts => {
    res.render('vpost', {posts: posts})
  })
}
});

//View specific post and the comments.

app.get('/vpost/:postId', function(req, res){
  const postId = req.params.postId;
  let inputcomment = req.body.cmnt


  Post.findOne({
		where: {
			id: postId
		},
		include: [{
			model: User,
      model: Comments
		}]
	})
	.then(function(order){
		res.render("singlepost", {order:order});
	})
});

app.post('/vpost/:postId', function(req, res){
	let inputcomment = req.body.cmnt

			Comments.create({
				com: inputcomment,
        userId: req.session.user.id,
        postId: req.params.postId
			}).then( () => {
				res.redirect(`/vpost/${req.params.postId}`);
			});
})




sequelize.sync()

app.listen(3000, function(){
  console.log("App listening on port 3000")
  })
