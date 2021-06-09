const express = require('express')
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const EmailValidator = require('email-deep-validator');
const emailValidator = new EmailValidator();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
app.use(cors())
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.listen(process.env.PORT || 4000);
const URL = "mongodb+srv://dbuser:helloworld@shareyourthought.wgqqt.mongodb.net/share?retryWrites=true&w=majority"
const DB = "share";
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    
      user: "unnamedbot2oo5@gmail.com",
      pass: "*********"
    }
  });

  app.post("/register",async(req,res)=>{
    console.log("register");
   try{  
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(req.body.email);
    if(wellFormed && validDomain && validMailbox)
    {
    if((await db.collection("user").find({email:req.body.email}).toArray()).length==0)
    {
      if((await db.collection("user").find({profilename:req.body.profilename}).toArray()).length==0)
      {
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password,salt);
        req.body.password = hash;
        await db.collection("user").insertOne(req.body);
        res.json({
            "message":"Registered"
        })
      }else
      {
        res.json({
            "message":"profilename already exist"
        }) 
      }  
   
    }
    else
    {
        res.json({
            "message":"user already exist"
        })    
    } }
    else
    {
        res.json({
            "message":"Enter valid email id"
        })
    }
    connection.close();
   }
    catch(error)
    {
        console.log(error);
    }
   
})

app.post("/login",async(req,res)=>{
    console.log("login");
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
   // console.log(req.body.email);
    let user = await db.collection("user").find({email:req.body.email}).toArray() ;
    //console.log("user",user);
    if(user.length!=0)
    {
      console.log(req.body.password,user[0].password)
      let isPassword = await bcrypt.compare(req.body.password,user[0].password);
      //console.log(isPassword);
      if(isPassword)
      {
             let token = jwt.sign({_id:user[0]._id},"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
             res.json({
             "message" : "Allowed",
             token ,
             userid : user[0]._id
        })
      }else
      {
        res.json({
            "message" : "Login id or password is wrong"
        })
      }
      
    }
    else
    {
        res.json({
            "message" : "Login id or password is wrong"
        }) 
    }
    connection.close();
})
app.post("/email",async (req,res)=>{
    console.log("email");
    try{  
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(req.body.email);
        if(wellFormed && validDomain && validMailbox)
        { 
            let user = await db.collection("user").find({email:req.body.email}).toArray();
           // console.log(user)
            if(user.length!=0)
            {
                let mailOptions = {
                    from: 'unnamedbot2oo5@gmail.com', // TODO: email sender
                    to: req.body.email, // TODO: email receiver
                    subject: 'Password reset',
                    text: `Reset your password using the link : https://goofy-nobel-36d9fd.netlify.app/resetpassword/${user[0]._id}`
                };
                
                // Step 3
                transporter.sendMail(mailOptions, (err, data) => {
                    if (err) {
                        console.log(err);
                    }
                    
                });
                res.json({"message":'Email sent!!! check your inbox',
                "sent":true});
            }
            else
            {
                res.json({
                    "message":"Please Register to access",
                    "sent":false
                })     
            }
        }
        else
        {
           res.json({
                "message":"Please enter valid email",
                "sent":false
            })
        } 
        connection.close();
    }
    catch(err)
    {
      console.log(err)
      res.json({
        "message":"Please enter valid email",
        "sent":false
    })
    }
})
app.post("/addpost",verification,async (req,res)=>{
    console.log("addpost");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("post").insertOne(req.body);
    await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{post:result.ops[0]._id}})
    res.json({
        "message":"Added"
    })
 
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})

app.post("/getprofile/:id",verification,async (req,res)=>{
    console.log("getprofile");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("user").find({_id:mongodb.ObjectID(req.params.id)}).toArray();
    if(result.length==0)
    {  
        res.json({"available":false})
    }
    else
    {
      
    res.send(result[0]);
    }
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})
app.post("/getpostc",async (req,res)=>{
    console.log("getposts");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("post").find({community:{$in:req.body.community}}).toArray();
    if(result.length==0)
    {  
        res.send(result);
    }
    else
    {
      
    res.send(result);
    }
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})
app.post("/getfriendsp",async (req,res)=>{
    console.log("getpost of friends");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("post").find({profilename:{$in : req.body.friends}}).toArray();
    if(result.length==0)
    {  
        res.send(result);
    }
    else
    {
    res.send(result);
    }
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})
app.put("/changename/:id",verification,async (req,res)=>{
    console.log("change name");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$set:{name :req.body.name}})
        res.json({"message":"changed"});
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/changepassword/:id",async (req,res)=>{
    console.log("change password");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password,salt);
        req.body.password = hash;
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$set:{password :req.body.password}})
        res.json({"message":"changed"});
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/changeprofilepic/:id",verification,async (req,res)=>{
    console.log("change profilepic");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$set:{profilepic :req.body.profilepic}})
        res.json({"message":"changed"});
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/addlike/:id",verification,async (req,res)=>{
    console.log("add like");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("post").updateOne({_id:mongodb.ObjectID(req.params.id)},{$push :{likeid:req.body.likeid}})
        res.json({"message":"added"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/adddislike/:id",verification,async (req,res)=>{
    console.log("add dislike");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("post").updateOne({_id:mongodb.ObjectID(req.params.id)},{$push :{dislikeid:req.body.dislikeid}})
        res.json({"message":"added"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})

app.put("/removelike/:id",verification,async (req,res)=>{
    console.log("remove like");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("post").updateOne({_id:mongodb.ObjectID(req.params.id)},{$pull :{likeid:req.body.likeid}})
        res.json({"message":"removed"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/removedislike/:id",verification,async (req,res)=>{
    console.log("remove dislike");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("post").updateOne({_id:mongodb.ObjectID(req.params.id)},{$pull :{dislikeid:req.body.dislikeid}})
        res.json({"message":"removed"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/addcommunity/:id",verification,async (req,res)=>{
    console.log("add community");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$push :{community:req.body.community}})
        res.json({"message":"added"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/addfriend/:id",verification,async (req,res)=>{
    console.log("add community");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$push :{friends:req.body.friends}})
        res.json({"message":"added"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/removecommunity/:id",verification,async (req,res)=>{
    console.log("remove community");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$pull :{community:req.body.community}})
        res.json({"message":"Removed"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.put("/removefriend/:id",verification,async (req,res)=>{
    console.log("remove friends");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$pull :{friends:req.body.friends}})
        res.json({"message":"Removed"})
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.get("/allcommunity",verification,async (req,res)=>{
    console.log("Getall communities")
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let list  = await db.collection("post").distinct("community");
        res.send(list);
    }
    catch(err)
    {
      console.log("error : ",err)
    }
    connection.close(); 
})
app.get("/allfriend",verification,async (req,res)=>{
    console.log("Getall communities")
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let list  = await db.collection("user").distinct("profilename");
        res.send(list);
    }
    catch(err)
    {
      console.log("error : ",err)
    }
    connection.close(); 
})
app.get("/getpost/:id",verification,async (req,res)=>{
    console.log("Getpost of user")
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let list  = await db.collection("post").find({userid:req.params.id}).toArray();
        res.send(list);
    }
    catch(err)
    {
      console.log("error : ",err)
    }
    connection.close(); 
})
app.get("/getpostcommunity/:id",verification,async (req,res)=>{
    console.log("Getsearch by community")
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let list  = await db.collection("post").find({community:req.params.id}).toArray();
        res.send(list);
    }
    catch(err)
    {
      console.log("error : ",err)
    }
    connection.close(); 
})
app.get("/getpostfriends/:id",verification,async (req,res)=>{
    console.log("Getsearch by friends")
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let list  = await db.collection("post").find({profilename:req.params.id}).toArray();
        res.send(list);
    }
    catch(err)
    {
      console.log("error : ",err)
    }
    connection.close(); 
})
app.delete("/deletepost/:id",verification,async(req,res)=>{
    console.log("deletepost")
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
         await db.collection("post").deleteOne({_id:mongodb.ObjectID(req.params.id)})
        res.json({
            "message":"Deleted"
        })
    }
    catch(err)
    {
      console.log("error : ",err)
    }
    connection.close();  
})
function verification(req,res,next)
{ 
  //  console.log("Verification",req.body)
      if(req.headers.authorization)
  {
      try
      {
          let check = jwt.verify(req.headers.authorization,"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
          if(check)
          {
              next();
          }
          else
          {
              res.json({
                "message":"authorization failed_!"           
              })
          }
      }
      catch(err)
      {
        console.log(err)
        res.json({
            "message":"authorization failed_2"           
          })
      }
  }   
  else
  {
    res.json({
        "message":"authorization failed"           
      })  
  }
}

