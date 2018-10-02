const express = require('express');
const bodyParser = require('body-parser');
const ejs= require('ejs');
const session = require('express-session');
const Sequelize = require('sequelize')


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

    const Comment = sequelize.define('comments',{
      com: {
        type: Sequelize.STRING,
      }
    },
      {
      timestamps: false
      });
