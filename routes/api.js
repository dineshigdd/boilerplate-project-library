/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const uri = process.env.DB;



module.exports = function (app) {	
	let bookCollection, database;
  MongoClient.connect( uri,(err ,db)=>{
    try{
    database = db;
    console.log( "connect to Mongo DB");
    bookCollection = database.db("libraryDB").collection("books");
    }catch(err){
      console.log( err );
    }
  });

 

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      
      bookCollection.aggregate([
        {
           $project: {  
              title: 1,    
              comments: 1,            
              commentcount: { $size: "$comments" }              

           }
        }
     ] , ( err, result) => res.json(result))
    })
    
    .post(function (req, res){
      let title = req.body.title;
      //response will contain new book object including atleast _id and title
			//ops is a property of the return object of insertOne fx
        bookCollection.insertOne({ title: title, comments:[] } ,( err , result )=>{
          if( err ) throw err;
           result.ops.forEach( data => {
             res.json( { _id: data._id , title: title })
           })
          
        });      

        // bookCollection.find({}).toArray((err, result )=>{
        //   if (err) throw err;
          
        //   res.json(result);
        
        // })
       
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      bookCollection.remove({}, (err, removedDocs )=>{
        if( err ) throw err;       
          res.json( { booksDeleted:removedDocs.result.n })//total number of documents removed
        
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      let bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      bookCollection.findOne({ _id: ObjectId(bookid) },( err,result) =>{
				if( err ) throw err;
				 res.json({
					 "_id": bookid,
					 "title": result.title,
					 "comments": result.comments
				 })
			})
    })
    
    .post(function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;
      //json res format same as .get
     
      let myquery = { _id: ObjectId(bookid) };
      let update = { $push: { comments: comment } };
      //{ returnOriginal: false } returns updated document
      //https://stackoverflow.com/questions/35626040/findoneandupdate-used-with-returnnewdocumenttrue-returns-the-original-document
      const options = { returnOriginal: false };

      bookCollection.findOneAndUpdate( myquery, update , options ).then(updatedDocument => {
          if(updatedDocument) {
            res.json( updatedDocument.value )
          } else {
            res.send("No document matches the provided query.")
          }
          return updatedDocument
        })
        .catch(err => console.error(`Failed to find and update document: ${err}`))
      
       
    })
    
  
    .delete(function(req, res){
      let bookid = req.params.id;     
      //if successful response will be 'delete successful'
      bookCollection.remove( {_id:ObjectId(bookid) } ,( err )=>{
        if( err ) throw err;
        res.send("delete successful");
      })
    });
  
    
};

