if(process.env.NODE_ENV !="production"){
    require('dotenv').config()
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter=require("./routes/listings.js");
const reviewRouter=require("./routes/reviews.js");
const userRouter=require("./routes/user.js");

// const Url="mongodb://127.0.0.1:27017/wanderLust";

const atlasUrl=process.env.ATLASDB_URL;

main().then((res)=>{
    console.log("Database Connect");
})
.catch((err)=>{
    console.log("err");
})

async function main(){
    await mongoose.connect(atlasUrl);
}

app.set("views engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"public")));

const store= MongoStore.create({
    mongoUrl:atlasUrl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600,
})

const sessionOption={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
}

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.engine("ejs",ejsMate);


// Server Request
app.listen(8080,(req,res)=>{
    console.log("Requesting on Server 8080");
})


// app.get("/",(req,res)=>{
//     res.send("/ working");
// })

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
})

// app.get("/demouser",async(req,res)=>{
//     let fakeuser=new User({
//         email:"abc@gmail.com",
//         username:"_chirag",
//     });

//     let registredUser=await User.register(fakeuser,"chiarg@123");
//     res.send(registredUser);
// })

app.use("/listings",listingRouter);

app.use("/listings/:id/reviews",reviewRouter);

app.use("/",userRouter);


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found"));
})

app.use((err,req,res,next)=>{
    let{status=500,message="Something went wrong"}=err;
    res.status(status).render("error.ejs",{message});
})



